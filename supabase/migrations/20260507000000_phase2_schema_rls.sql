create extension if not exists "pgcrypto";

do $$
begin
  create type public.global_system_role as enum ('standard', 'super_admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.station_membership_role as enum ('crew', 'dla', 'lom', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.asset_category as enum (
    'lifeboat',
    'launch_recovery',
    'vehicle',
    'equipment',
    'support'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.asset_status as enum (
    'ready',
    'amber',
    'red',
    'maintenance',
    'off_service'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.currency_state as enum ('green', 'amber', 'red');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.qualification_kind as enum (
    'operational',
    'casualty_care',
    'support',
    'safety'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.availability_slot_kind as enum (
    'full_day',
    'partial_day',
    'night_cover',
    'unavailable'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.duty_period_kind as enum (
    'day_cover',
    'night_cover',
    'launch_alert',
    'incident_cover',
    'training'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.incident_status as enum (
    'open',
    'active',
    'stood_down',
    'closed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_channel as enum (
    'in_app',
    'email',
    'sms',
    'whatsapp',
    'push'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_status as enum (
    'queued',
    'sent',
    'failed',
    'acknowledged'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.delivery_status as enum (
    'pending',
    'sent',
    'failed',
    'skipped'
  );
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  name text not null,
  code text,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, slug)
);

create table if not exists public.station_locations (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations (id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (station_id, slug)
);

create table if not exists public.asset_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category public.asset_category not null,
  description text,
  requires_recovery_equipment boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations (id) on delete cascade,
  station_location_id uuid not null references public.station_locations (id) on delete cascade,
  asset_type_id uuid not null references public.asset_types (id),
  name text not null,
  asset_code text,
  status public.asset_status not null default 'ready',
  requires_recovery_support boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (station_id, asset_code)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organisation_id uuid references public.organisations (id) on delete set null,
  display_name text,
  email text,
  phone text,
  system_role public.global_system_role not null default 'standard',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crew_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.station_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  station_id uuid not null references public.stations (id) on delete cascade,
  crew_type_id uuid references public.crew_types (id) on delete set null,
  membership_role public.station_membership_role not null,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, station_id, membership_role, crew_type_id)
);

create table if not exists public.operational_roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  category text not null default 'operational',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qualification_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  kind public.qualification_kind not null,
  description text,
  requires_expiry boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_role_qualifications (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations (id) on delete cascade,
  asset_type_id uuid references public.asset_types (id) on delete cascade,
  asset_id uuid references public.assets (id) on delete cascade,
  operational_role_id uuid not null references public.operational_roles (id) on delete cascade,
  qualification_type_id uuid references public.qualification_types (id) on delete set null,
  minimum_currency public.currency_state not null default 'green',
  requires_expiry boolean not null default false,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (station_id, asset_type_id, asset_id, operational_role_id, qualification_type_id)
);

create table if not exists public.asset_minimum_crewing (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations (id) on delete cascade,
  asset_type_id uuid references public.asset_types (id) on delete cascade,
  asset_id uuid references public.assets (id) on delete cascade,
  minimum_crew_count integer not null default 0,
  minimum_boat_crew_count integer not null default 0,
  minimum_shore_crew_count integer not null default 0,
  minimum_casualty_care_count integer not null default 0,
  requires_dla_presence boolean not null default false,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (station_id, asset_type_id, asset_id)
);

create table if not exists public.crew_qualifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  station_id uuid not null references public.stations (id) on delete cascade,
  qualification_type_id uuid not null references public.qualification_types (id) on delete cascade,
  asset_type_id uuid references public.asset_types (id) on delete cascade,
  asset_id uuid references public.assets (id) on delete cascade,
  operational_role_id uuid references public.operational_roles (id) on delete cascade,
  currency_state public.currency_state not null default 'green',
  starts_on date not null default current_date,
  expires_on date,
  verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  station_id uuid not null references public.stations (id) on delete cascade,
  station_location_id uuid references public.station_locations (id) on delete set null,
  asset_type_id uuid references public.asset_types (id) on delete set null,
  asset_id uuid references public.assets (id) on delete set null,
  operational_role_id uuid references public.operational_roles (id) on delete set null,
  slot_kind public.availability_slot_kind not null,
  coverage_date date,
  start_time time not null,
  end_time time not null,
  days_of_week smallint[] not null default '{}',
  is_recurring boolean not null default false,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.duty_periods (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  station_location_id uuid references public.station_locations (id) on delete set null,
  asset_type_id uuid references public.asset_types (id) on delete set null,
  asset_id uuid references public.assets (id) on delete set null,
  operational_role_id uuid references public.operational_roles (id) on delete set null,
  period_kind public.duty_period_kind not null,
  duty_date date not null,
  start_time time not null,
  end_time time not null,
  source text not null default 'manual',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  station_id uuid not null references public.stations (id) on delete cascade,
  reported_by_profile_id uuid references public.profiles (id) on delete set null,
  status public.incident_status not null default 'open',
  title text not null,
  summary text,
  location_notes text,
  launched_at timestamptz not null default now(),
  stood_down_at timestamptz,
  closed_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incident_assets (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete cascade,
  asset_status public.asset_status,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (incident_id, asset_id)
);

create table if not exists public.incident_responses (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  response_status text not null,
  responded_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations (id) on delete cascade,
  station_id uuid references public.stations (id) on delete cascade,
  recipient_profile_id uuid references public.profiles (id) on delete set null,
  channel public.notification_channel not null,
  notification_type text not null,
  title text not null,
  body text not null,
  priority integer not null default 0,
  status public.notification_status not null default 'queued',
  related_table text,
  related_id uuid,
  created_by_profile_id uuid references public.profiles (id) on delete set null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  attempt_number integer not null default 1,
  delivery_status public.delivery_status not null default 'pending',
  provider_name text,
  provider_message_id text,
  attempted_at timestamptz not null default now(),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (notification_id, attempt_number)
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations (id) on delete set null,
  station_id uuid references public.stations (id) on delete set null,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  before_data jsonb not null default '{}'::jsonb,
  after_data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations (id) on delete cascade,
  station_id uuid references public.stations (id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  updated_by_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, station_id, setting_key)
);

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.system_role = 'super_admin'
      and p.is_active
  );
$$;

create or replace function public.is_station_member(target_station_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.station_memberships sm
    where sm.profile_id = auth.uid()
      and sm.station_id = target_station_id
      and sm.is_active
  );
$$;

create or replace function public.has_station_role(
  target_station_id uuid,
  target_roles public.station_membership_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.station_memberships sm
    where sm.profile_id = auth.uid()
      and sm.station_id = target_station_id
      and sm.is_active
      and sm.membership_role = any (target_roles)
  );
$$;

create or replace function public.can_manage_station(target_station_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
      or public.has_station_role(
        target_station_id,
        array['admin', 'lom']::public.station_membership_role[]
      );
$$;

create or replace function public.can_manage_organisation(target_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
      or exists (
        select 1
        from public.profiles p
        join public.station_memberships sm
          on sm.profile_id = p.id
        join public.stations s
          on s.id = sm.station_id
        where p.id = auth.uid()
          and p.organisation_id = target_organisation_id
          and p.is_active
          and sm.is_active
          and sm.membership_role in ('admin', 'lom')
          and s.organisation_id = target_organisation_id
      );
$$;

create or replace function public.can_dla_station(target_station_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
      or public.has_station_role(
        target_station_id,
        array['admin', 'lom', 'dla']::public.station_membership_role[]
      );
$$;

create index if not exists stations_organisation_id_idx on public.stations (organisation_id);
create index if not exists station_locations_station_id_idx on public.station_locations (station_id);
create index if not exists assets_station_id_idx on public.assets (station_id);
create index if not exists assets_station_location_id_idx on public.assets (station_location_id);
create index if not exists station_memberships_profile_id_idx on public.station_memberships (profile_id);
create index if not exists station_memberships_station_id_idx on public.station_memberships (station_id);
create index if not exists asset_role_qualifications_station_id_idx on public.asset_role_qualifications (station_id);
create index if not exists asset_minimum_crewing_station_id_idx on public.asset_minimum_crewing (station_id);
create index if not exists crew_qualifications_profile_id_idx on public.crew_qualifications (profile_id);
create index if not exists crew_qualifications_station_id_idx on public.crew_qualifications (station_id);
create index if not exists availability_slots_profile_id_idx on public.availability_slots (profile_id);
create index if not exists availability_slots_station_id_idx on public.availability_slots (station_id);
create index if not exists duty_periods_station_id_idx on public.duty_periods (station_id);
create index if not exists incidents_station_id_idx on public.incidents (station_id);
create index if not exists notifications_station_id_idx on public.notifications (station_id);
create index if not exists audit_log_station_id_idx on public.audit_log (station_id);

create trigger set_organisations_updated_at
before update on public.organisations
for each row execute function public.set_updated_at();

create trigger set_stations_updated_at
before update on public.stations
for each row execute function public.set_updated_at();

create trigger set_station_locations_updated_at
before update on public.station_locations
for each row execute function public.set_updated_at();

create trigger set_asset_types_updated_at
before update on public.asset_types
for each row execute function public.set_updated_at();

create trigger set_assets_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_crew_types_updated_at
before update on public.crew_types
for each row execute function public.set_updated_at();

create trigger set_station_memberships_updated_at
before update on public.station_memberships
for each row execute function public.set_updated_at();

create trigger set_operational_roles_updated_at
before update on public.operational_roles
for each row execute function public.set_updated_at();

create trigger set_qualification_types_updated_at
before update on public.qualification_types
for each row execute function public.set_updated_at();

create trigger set_asset_role_qualifications_updated_at
before update on public.asset_role_qualifications
for each row execute function public.set_updated_at();

create trigger set_asset_minimum_crewing_updated_at
before update on public.asset_minimum_crewing
for each row execute function public.set_updated_at();

create trigger set_crew_qualifications_updated_at
before update on public.crew_qualifications
for each row execute function public.set_updated_at();

create trigger set_availability_slots_updated_at
before update on public.availability_slots
for each row execute function public.set_updated_at();

create trigger set_duty_periods_updated_at
before update on public.duty_periods
for each row execute function public.set_updated_at();

create trigger set_incidents_updated_at
before update on public.incidents
for each row execute function public.set_updated_at();

create trigger set_incident_assets_updated_at
before update on public.incident_assets
for each row execute function public.set_updated_at();

create trigger set_incident_responses_updated_at
before update on public.incident_responses
for each row execute function public.set_updated_at();

create trigger set_notifications_updated_at
before update on public.notifications
for each row execute function public.set_updated_at();

create trigger set_notification_delivery_attempts_updated_at
before update on public.notification_delivery_attempts
for each row execute function public.set_updated_at();

create trigger set_system_settings_updated_at
before update on public.system_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, system_role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    'standard'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.organisations enable row level security;
alter table public.stations enable row level security;
alter table public.station_locations enable row level security;
alter table public.asset_types enable row level security;
alter table public.assets enable row level security;
alter table public.profiles enable row level security;
alter table public.crew_types enable row level security;
alter table public.station_memberships enable row level security;
alter table public.operational_roles enable row level security;
alter table public.qualification_types enable row level security;
alter table public.asset_role_qualifications enable row level security;
alter table public.asset_minimum_crewing enable row level security;
alter table public.crew_qualifications enable row level security;
alter table public.availability_slots enable row level security;
alter table public.duty_periods enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_assets enable row level security;
alter table public.incident_responses enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_delivery_attempts enable row level security;
alter table public.audit_log enable row level security;
alter table public.system_settings enable row level security;

create policy "organisations_select_own_org_or_super_admin"
on public.organisations
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.organisation_id = organisations.id
  )
);

create policy "organisations_manage_own_org_or_super_admin"
on public.organisations
for all
to authenticated
using (
  public.can_manage_organisation(organisations.id)
)
with check (
  public.can_manage_organisation(organisations.id)
);

create policy "stations_select_by_membership_or_super_admin"
on public.stations
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_station_member(stations.id)
);

create policy "stations_manage_by_station_admin_or_lom"
on public.stations
for all
to authenticated
using (
  public.can_manage_station(stations.id)
)
with check (
  public.can_manage_station(stations.id)
);

create policy "station_locations_select_by_membership_or_super_admin"
on public.station_locations
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_station_member(station_locations.station_id)
);

create policy "station_locations_manage_by_station_admin_or_lom"
on public.station_locations
for all
to authenticated
using (
  public.can_manage_station(station_locations.station_id)
)
with check (
  public.can_manage_station(station_locations.station_id)
);

create policy "asset_types_select_authenticated"
on public.asset_types
for select
to authenticated
using (auth.uid() is not null);

create policy "asset_types_manage_super_admin"
on public.asset_types
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "assets_select_by_station_membership_or_super_admin"
on public.assets
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_station_member(assets.station_id)
);

create policy "assets_manage_by_station_admin_or_lom"
on public.assets
for all
to authenticated
using (
  public.can_manage_station(assets.station_id)
)
with check (
  public.can_manage_station(assets.station_id)
);

create policy "profiles_select_own_or_station_scope"
on public.profiles
for select
to authenticated
using (
  auth.uid() = profiles.id
  or public.is_super_admin()
  or exists (
    select 1
    from public.station_memberships target_sm
    join public.station_memberships current_sm
      on current_sm.station_id = target_sm.station_id
    where target_sm.profile_id = profiles.id
      and target_sm.is_active
      and current_sm.profile_id = auth.uid()
      and current_sm.is_active
      and current_sm.membership_role in ('admin', 'lom', 'dla')
  )
);

create policy "profiles_insert_self_or_super_admin"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = profiles.id
  or public.is_super_admin()
);

create policy "profiles_update_own_or_station_admin_or_super_admin"
on public.profiles
for update
to authenticated
using (
  auth.uid() = profiles.id
  or public.is_super_admin()
  or exists (
    select 1
    from public.station_memberships target_sm
    join public.station_memberships current_sm
      on current_sm.station_id = target_sm.station_id
    where target_sm.profile_id = profiles.id
      and target_sm.is_active
      and current_sm.profile_id = auth.uid()
      and current_sm.is_active
      and current_sm.membership_role in ('admin', 'lom')
  )
)
with check (
  auth.uid() = profiles.id
  or public.is_super_admin()
  or exists (
    select 1
    from public.station_memberships target_sm
    join public.station_memberships current_sm
      on current_sm.station_id = target_sm.station_id
    where target_sm.profile_id = profiles.id
      and target_sm.is_active
      and current_sm.profile_id = auth.uid()
      and current_sm.is_active
      and current_sm.membership_role in ('admin', 'lom')
  )
);

create policy "crew_types_select_authenticated"
on public.crew_types
for select
to authenticated
using (auth.uid() is not null);

create policy "crew_types_manage_super_admin"
on public.crew_types
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "station_memberships_select_by_station_scope"
on public.station_memberships
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_station_member(station_memberships.station_id)
);

create policy "station_memberships_manage_by_station_admin_or_lom"
on public.station_memberships
for all
to authenticated
using (
  public.can_manage_station(station_memberships.station_id)
)
with check (
  public.can_manage_station(station_memberships.station_id)
);

create policy "operational_roles_select_authenticated"
on public.operational_roles
for select
to authenticated
using (auth.uid() is not null);

create policy "operational_roles_manage_super_admin"
on public.operational_roles
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "qualification_types_select_authenticated"
on public.qualification_types
for select
to authenticated
using (auth.uid() is not null);

create policy "qualification_types_manage_super_admin"
on public.qualification_types
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "asset_role_qualifications_select_by_station_scope"
on public.asset_role_qualifications
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_station_member(asset_role_qualifications.station_id)
);

create policy "asset_role_qualifications_manage_by_station_admin_or_lom"
on public.asset_role_qualifications
for all
to authenticated
using (
  public.can_manage_station(asset_role_qualifications.station_id)
)
with check (
  public.can_manage_station(asset_role_qualifications.station_id)
);

create policy "asset_minimum_crewing_select_by_station_scope"
on public.asset_minimum_crewing
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_station_member(asset_minimum_crewing.station_id)
);

create policy "asset_minimum_crewing_manage_by_station_admin_or_lom"
on public.asset_minimum_crewing
for all
to authenticated
using (
  public.can_manage_station(asset_minimum_crewing.station_id)
)
with check (
  public.can_manage_station(asset_minimum_crewing.station_id)
);

create policy "crew_qualifications_select_own_or_station_scope"
on public.crew_qualifications
for select
to authenticated
using (
  auth.uid() = crew_qualifications.profile_id
  or public.is_super_admin()
  or public.can_dla_station(crew_qualifications.station_id)
);

create policy "crew_qualifications_manage_own_or_station_admin_or_super_admin"
on public.crew_qualifications
for all
to authenticated
using (
  auth.uid() = crew_qualifications.profile_id
  or public.can_manage_station(crew_qualifications.station_id)
  or public.is_super_admin()
)
with check (
  auth.uid() = crew_qualifications.profile_id
  or public.can_manage_station(crew_qualifications.station_id)
  or public.is_super_admin()
);

create policy "availability_slots_select_own_or_station_scope"
on public.availability_slots
for select
to authenticated
using (
  auth.uid() = availability_slots.profile_id
  or public.is_super_admin()
  or public.can_dla_station(availability_slots.station_id)
);

create policy "availability_slots_manage_own_or_station_admin_or_super_admin"
on public.availability_slots
for all
to authenticated
using (
  auth.uid() = availability_slots.profile_id
  or public.can_manage_station(availability_slots.station_id)
  or public.is_super_admin()
)
with check (
  auth.uid() = availability_slots.profile_id
  or public.can_manage_station(availability_slots.station_id)
  or public.is_super_admin()
);

create policy "duty_periods_select_own_or_station_scope"
on public.duty_periods
for select
to authenticated
using (
  auth.uid() = duty_periods.profile_id
  or public.is_super_admin()
  or public.can_dla_station(duty_periods.station_id)
);

create policy "duty_periods_manage_station_admin_or_dla_or_super_admin"
on public.duty_periods
for all
to authenticated
using (
  public.can_dla_station(duty_periods.station_id)
  or public.is_super_admin()
)
with check (
  public.can_dla_station(duty_periods.station_id)
  or public.is_super_admin()
);

create policy "incidents_select_station_scope"
on public.incidents
for select
to authenticated
using (
  public.is_super_admin()
  or public.is_station_member(incidents.station_id)
);

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
      and public.is_station_member(i.station_id)
  )
);

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
      and public.is_station_member(i.station_id)
  )
);

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
      and public.can_dla_station(i.station_id)
  )
);

create policy "notifications_select_own_or_station_scope"
on public.notifications
for select
to authenticated
using (
  notifications.recipient_profile_id = auth.uid()
  or public.is_super_admin()
  or (notifications.station_id is not null and public.is_station_member(notifications.station_id))
);

create policy "notifications_manage_station_scope_or_super_admin"
on public.notifications
for all
to authenticated
using (
  public.is_super_admin()
  or (
    notifications.station_id is not null
    and public.can_dla_station(notifications.station_id)
  )
)
with check (
  public.is_super_admin()
  or (
    notifications.station_id is not null
    and public.can_dla_station(notifications.station_id)
  )
);

create policy "notification_delivery_attempts_select_notification_scope"
on public.notification_delivery_attempts
for select
to authenticated
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.notifications n
    where n.id = notification_delivery_attempts.notification_id
      and (
        n.recipient_profile_id = auth.uid()
        or (n.station_id is not null and public.is_station_member(n.station_id))
      )
  )
);

create policy "notification_delivery_attempts_manage_super_admin"
on public.notification_delivery_attempts
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "audit_log_select_station_scope_or_super_admin"
on public.audit_log
for select
to authenticated
using (
  public.is_super_admin()
  or (
    audit_log.station_id is not null
    and public.can_manage_station(audit_log.station_id)
  )
);

create policy "audit_log_insert_authenticated_actor_only"
on public.audit_log
for insert
to authenticated
with check (
  auth.uid() is not null
  and (actor_profile_id = auth.uid() or public.is_super_admin())
);

create policy "system_settings_select_by_scope_or_super_admin"
on public.system_settings
for select
to authenticated
using (
  public.is_super_admin()
  or (
    system_settings.station_id is not null
    and public.can_manage_station(system_settings.station_id)
  )
  or (
    system_settings.station_id is null
    and system_settings.organisation_id is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.organisation_id = system_settings.organisation_id
    )
  )
);

create policy "system_settings_manage_by_scope_or_super_admin"
on public.system_settings
for all
to authenticated
using (
  public.is_super_admin()
  or (
    system_settings.station_id is not null
    and public.can_manage_station(system_settings.station_id)
  )
  or (
    system_settings.station_id is null
    and system_settings.organisation_id is not null
    and public.can_manage_organisation(system_settings.organisation_id)
  )
)
with check (
  public.is_super_admin()
  or (
    system_settings.station_id is not null
    and public.can_manage_station(system_settings.station_id)
  )
  or (
    system_settings.station_id is null
    and system_settings.organisation_id is not null
    and public.can_manage_organisation(system_settings.organisation_id)
  )
);
