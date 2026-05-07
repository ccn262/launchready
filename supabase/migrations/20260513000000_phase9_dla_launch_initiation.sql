do $$
begin
  create type public.incident_operation_type as enum (
    'service',
    'exercise',
    'passage',
    'boat_movement',
    'assurance_activity'
  );
exception
  when duplicate_object then null;
end $$;

alter type public.incident_status add value if not exists 'cancelled';

alter table public.incidents
  add column if not exists station_location_id uuid references public.station_locations (id) on delete set null,
  add column if not exists launch_authority_profile_id uuid references public.profiles (id) on delete set null,
  add column if not exists operation_type public.incident_operation_type not null default 'service',
  add column if not exists incident_type text not null default 'launch',
  add column if not exists dynamic_risk_assessment_notes text,
  add column if not exists readiness_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists selected_asset_ids jsonb not null default '[]'::jsonb,
  add column if not exists drafted_at timestamptz not null default now(),
  add column if not exists initiated_at timestamptz,
  add column if not exists cancelled_at timestamptz;

alter table public.incident_assets
  add column if not exists readiness_status_at_initiation text,
  add column if not exists readiness_snapshot jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'incident_responses_incident_profile_unique'
  ) then
    alter table public.incident_responses
      add constraint incident_responses_incident_profile_unique unique (incident_id, profile_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'incidents_station_status_created_idx'
  ) then
    create index incidents_station_status_created_idx
      on public.incidents (station_id, status, created_at desc);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'incident_assets_incident_id_idx'
  ) then
    create index incident_assets_incident_id_idx
      on public.incident_assets (incident_id, asset_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'incident_responses_incident_id_idx'
  ) then
    create index incident_responses_incident_id_idx
      on public.incident_responses (incident_id, profile_id);
  end if;
end $$;

drop policy if exists "incidents_select_station_scope" on public.incidents;
create policy "incidents_select_station_scope"
on public.incidents
for select
to authenticated
using (
  public.is_super_admin()
  or public.can_dla_station(incidents.station_id)
  or (
    public.is_station_member(incidents.station_id)
    and incidents.status <> 'open'
  )
);

drop policy if exists "incidents_manage_by_dla_or_station_admin" on public.incidents;
create policy "incidents_manage_by_dla_or_station_admin"
on public.incidents
for all
to authenticated
using (
  public.can_dla_station(incidents.station_id)
  or public.is_super_admin()
)
with check (
  public.can_dla_station(incidents.station_id)
  or public.is_super_admin()
);

drop policy if exists "incident_assets_select_station_scope" on public.incident_assets;
create policy "incident_assets_select_station_scope"
on public.incident_assets
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.incidents i
    where i.id = incident_assets.incident_id
      and (
        public.can_dla_station(i.station_id)
        or (
          public.is_station_member(i.station_id)
          and i.status <> 'open'
        )
      )
  )
);

drop policy if exists "incident_assets_manage_by_dla_or_station_admin" on public.incident_assets;
create policy "incident_assets_manage_by_dla_or_station_admin"
on public.incident_assets
for all
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.incidents i
    where i.id = incident_assets.incident_id
      and public.can_dla_station(i.station_id)
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.incidents i
    where i.id = incident_assets.incident_id
      and public.can_dla_station(i.station_id)
  )
);

drop policy if exists "incident_responses_select_own_or_station_scope" on public.incident_responses;
create policy "incident_responses_select_own_or_station_scope"
on public.incident_responses
for select
to authenticated
using (
  incident_responses.profile_id = auth.uid()
  or public.is_super_admin()
  or exists (
    select 1
    from public.incidents i
    where i.id = incident_responses.incident_id
      and (
        public.can_dla_station(i.station_id)
        or (
          public.is_station_member(i.station_id)
          and i.status = 'active'
        )
      )
  )
);

drop policy if exists "incident_responses_manage_own_or_station_admin" on public.incident_responses;
create policy "incident_responses_manage_own_or_station_admin"
on public.incident_responses
for all
to authenticated
using (
  incident_responses.profile_id = auth.uid()
  or public.is_super_admin()
  or exists (
    select 1
    from public.incidents i
    where i.id = incident_responses.incident_id
      and public.can_dla_station(i.station_id)
  )
)
with check (
  incident_responses.profile_id = auth.uid()
  or public.is_super_admin()
  or exists (
    select 1
    from public.incidents i
    where i.id = incident_responses.incident_id
      and (
        public.can_dla_station(i.station_id)
        or (
          public.is_station_member(i.station_id)
          and i.status = 'active'
        )
      )
  )
);
