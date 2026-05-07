do $$
begin
  create type public.cover_request_cover_type as enum (
    'weekend',
    'day',
    'night',
    'custom'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.cover_request_status as enum (
    'open',
    'accepted',
    'cancelled',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.cover_request_urgency as enum (
    'normal',
    'urgent'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.cover_request_response_status as enum (
    'offered',
    'accepted',
    'withdrawn',
    'rejected'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.cover_request_eligibility_status as enum (
    'eligible',
    'ineligible',
    'needs_admin_review'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.cover_requests (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations (id) on delete cascade,
  requester_profile_id uuid not null references public.profiles (id) on delete cascade,
  original_duty_period_id uuid references public.duty_periods (id) on delete set null,
  asset_id uuid references public.assets (id) on delete set null,
  operational_role_id uuid references public.operational_roles (id) on delete set null,
  crew_type_id uuid references public.crew_types (id) on delete set null,
  cover_type public.cover_request_cover_type not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.cover_request_status not null default 'open',
  urgency public.cover_request_urgency not null default 'normal',
  reason text not null,
  notes text,
  accepted_by_profile_id uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.cover_request_responses (
  id uuid primary key default gen_random_uuid(),
  cover_request_id uuid not null references public.cover_requests (id) on delete cascade,
  responder_profile_id uuid not null references public.profiles (id) on delete cascade,
  response_status public.cover_request_response_status not null default 'offered',
  eligibility_status public.cover_request_eligibility_status not null default 'needs_admin_review',
  eligibility_notes text,
  notes text,
  responded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cover_request_id, responder_profile_id)
);

create index if not exists cover_requests_station_status_created_idx
  on public.cover_requests (station_id, status, urgency, created_at desc);

create index if not exists cover_requests_requester_idx
  on public.cover_requests (requester_profile_id, station_id);

create index if not exists cover_requests_asset_idx
  on public.cover_requests (asset_id);

create index if not exists cover_request_responses_request_idx
  on public.cover_request_responses (cover_request_id, response_status, created_at desc);

create index if not exists cover_request_responses_responder_idx
  on public.cover_request_responses (responder_profile_id, cover_request_id);

create trigger set_cover_requests_updated_at
before update on public.cover_requests
for each row execute function public.set_updated_at();

create trigger set_cover_request_responses_updated_at
before update on public.cover_request_responses
for each row execute function public.set_updated_at();

alter table public.cover_requests enable row level security;
alter table public.cover_request_responses enable row level security;

drop policy if exists "cover_requests_select_station_scope_or_super_admin" on public.cover_requests;
create policy "cover_requests_select_station_scope_or_super_admin"
on public.cover_requests
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_station_member(station_id)
);

drop policy if exists "cover_requests_insert_station_scope_or_super_admin" on public.cover_requests;
create policy "cover_requests_insert_station_scope_or_super_admin"
on public.cover_requests
for insert
to authenticated
with check (
  public.is_super_admin()
  or public.can_manage_station(station_id)
  or (
    requester_profile_id = auth.uid()
    and public.is_station_member(station_id)
  )
);

drop policy if exists "cover_requests_update_station_scope_or_super_admin" on public.cover_requests;
create policy "cover_requests_update_station_scope_or_super_admin"
on public.cover_requests
for update
to authenticated
using (
  public.is_super_admin()
  or public.can_manage_station(station_id)
  or requester_profile_id = auth.uid()
)
with check (
  public.is_super_admin()
  or public.can_manage_station(station_id)
  or requester_profile_id = auth.uid()
);

drop policy if exists "notifications_insert_station_member_or_super_admin" on public.notifications;
create policy "notifications_insert_station_member_or_super_admin"
on public.notifications
for insert
to authenticated
with check (
  public.is_super_admin()
  or (
    station_id is not null
    and public.is_station_member(station_id)
  )
);

drop policy if exists "cover_request_responses_select_station_scope_or_super_admin" on public.cover_request_responses;
create policy "cover_request_responses_select_station_scope_or_super_admin"
on public.cover_request_responses
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.cover_requests cr
    where cr.id = cover_request_responses.cover_request_id
      and public.is_station_member(cr.station_id)
  )
);

drop policy if exists "cover_request_responses_insert_station_scope_or_super_admin" on public.cover_request_responses;
create policy "cover_request_responses_insert_station_scope_or_super_admin"
on public.cover_request_responses
for insert
to authenticated
with check (
  responder_profile_id = auth.uid()
  and exists (
    select 1
    from public.cover_requests cr
    where cr.id = cover_request_responses.cover_request_id
      and public.is_station_member(cr.station_id)
      and cr.requester_profile_id <> auth.uid()
  )
);

drop policy if exists "cover_request_responses_update_station_scope_or_super_admin" on public.cover_request_responses;
create policy "cover_request_responses_update_station_scope_or_super_admin"
on public.cover_request_responses
for update
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.cover_requests cr
    where cr.id = cover_request_responses.cover_request_id
      and public.is_station_member(cr.station_id)
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.cover_requests cr
    where cr.id = cover_request_responses.cover_request_id
      and public.is_station_member(cr.station_id)
  )
);
