do $$
begin
  create type public.safe_crewing_operation_type as enum (
    'service',
    'exercise',
    'passage',
    'boat_movement',
    'assurance_activity'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.safe_crewing_requirement_level as enum (
    'hard_stop',
    'required',
    'preferred'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.safe_crewing_rules (
  id uuid primary key default gen_random_uuid(),
  asset_type_id uuid not null references public.asset_types (id) on delete cascade,
  operation_type public.safe_crewing_operation_type not null,
  minimum_crew integer not null,
  maximum_crew integer,
  darkness_minimum_crew integer,
  effective_from date not null,
  effective_to date,
  source_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (minimum_crew > 0),
  check (maximum_crew is null or maximum_crew >= minimum_crew),
  check (darkness_minimum_crew is null or darkness_minimum_crew > 0)
);

create table if not exists public.safe_crewing_role_requirements (
  id uuid primary key default gen_random_uuid(),
  asset_type_id uuid not null references public.asset_types (id) on delete cascade,
  operation_type public.safe_crewing_operation_type not null,
  operational_role_id uuid not null references public.operational_roles (id) on delete cascade,
  required_count integer not null default 1,
  requirement_level public.safe_crewing_requirement_level not null default 'required',
  effective_from date not null,
  effective_to date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (required_count > 0)
);

create table if not exists public.asset_launch_recovery_requirements (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets (id) on delete cascade,
  operational_role_id uuid not null references public.operational_roles (id) on delete cascade,
  required_count integer not null default 1,
  requirement_level public.safe_crewing_requirement_level not null default 'required',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (required_count > 0)
);

create unique index if not exists safe_crewing_rules_unique_idx
  on public.safe_crewing_rules (asset_type_id, operation_type, effective_from);

create index if not exists safe_crewing_rules_asset_type_operation_idx
  on public.safe_crewing_rules (asset_type_id, operation_type, effective_from desc);

create unique index if not exists safe_crewing_role_requirements_unique_idx
  on public.safe_crewing_role_requirements (asset_type_id, operation_type, operational_role_id, effective_from);

create index if not exists safe_crewing_role_requirements_asset_type_operation_idx
  on public.safe_crewing_role_requirements (asset_type_id, operation_type, effective_from desc);

create unique index if not exists asset_launch_recovery_requirements_unique_idx
  on public.asset_launch_recovery_requirements (asset_id, operational_role_id, requirement_level);

create index if not exists asset_launch_recovery_requirements_asset_id_idx
  on public.asset_launch_recovery_requirements (asset_id);

create trigger set_safe_crewing_rules_updated_at
before update on public.safe_crewing_rules
for each row execute function public.set_updated_at();

create trigger set_safe_crewing_role_requirements_updated_at
before update on public.safe_crewing_role_requirements
for each row execute function public.set_updated_at();

create trigger set_asset_launch_recovery_requirements_updated_at
before update on public.asset_launch_recovery_requirements
for each row execute function public.set_updated_at();

alter table public.safe_crewing_rules enable row level security;
alter table public.safe_crewing_role_requirements enable row level security;
alter table public.asset_launch_recovery_requirements enable row level security;

drop policy if exists "safe_crewing_rules_select_authenticated" on public.safe_crewing_rules;
create policy "safe_crewing_rules_select_authenticated"
on public.safe_crewing_rules
for select
to authenticated
using (auth.role() = 'authenticated');

drop policy if exists "safe_crewing_rules_manage_super_admin" on public.safe_crewing_rules;
create policy "safe_crewing_rules_manage_super_admin"
on public.safe_crewing_rules
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "safe_crewing_role_requirements_select_authenticated" on public.safe_crewing_role_requirements;
create policy "safe_crewing_role_requirements_select_authenticated"
on public.safe_crewing_role_requirements
for select
to authenticated
using (auth.role() = 'authenticated');

drop policy if exists "safe_crewing_role_requirements_manage_super_admin" on public.safe_crewing_role_requirements;
create policy "safe_crewing_role_requirements_manage_super_admin"
on public.safe_crewing_role_requirements
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "asset_launch_recovery_requirements_select_station_scope" on public.asset_launch_recovery_requirements;
create policy "asset_launch_recovery_requirements_select_station_scope"
on public.asset_launch_recovery_requirements
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.assets a
    where a.id = asset_launch_recovery_requirements.asset_id
      and public.can_dla_station(a.station_id)
  )
);

drop policy if exists "asset_launch_recovery_requirements_manage_station_scope" on public.asset_launch_recovery_requirements;
create policy "asset_launch_recovery_requirements_manage_station_scope"
on public.asset_launch_recovery_requirements
for all
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.assets a
    where a.id = asset_launch_recovery_requirements.asset_id
      and public.can_manage_station(a.station_id)
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.assets a
    where a.id = asset_launch_recovery_requirements.asset_id
      and public.can_manage_station(a.station_id)
  )
);
