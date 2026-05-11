-- Launch Ready development/demo seed data.
-- Safe to rerun. Uses fake crew identities only.
-- This file does not create Supabase Auth users.
-- Demo profiles can be used for browser testing only after matching Auth users
-- are created separately or via a future invite/signup flow.

begin;

-- public.profiles references auth.users, so we temporarily bypass FK enforcement
-- for the profile rows only. The demo dataset keeps all later public-table
-- references consistent and relies on matching Auth users if login testing is
-- needed for these demo identities.
set local session_replication_role = replica;

insert into public.profiles (
  id,
  organisation_id,
  display_name,
  email,
  phone,
  system_role,
  is_active
)
values
  ('11111111-1111-4111-8111-000000000101'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), 'Chris Helm Demo', 'chris.helm.demo@example.test', null, 'standard', true),
  ('11111111-1111-4111-8111-000000000102'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), 'Alex Tier1 Demo', 'alex.tier1.demo@example.test', null, 'standard', true),
  ('11111111-1111-4111-8111-000000000103'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), 'Sam Tier2 Demo', 'sam.tier2.demo@example.test', null, 'standard', true),
  ('11111111-1111-4111-8111-000000000104'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), 'Jess Navigator Demo', 'jess.navigator.demo@example.test', null, 'standard', true),
  ('11111111-1111-4111-8111-000000000105'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), 'Pat Head Launcher Demo', 'pat.headlauncher.demo@example.test', null, 'standard', true),
  ('11111111-1111-4111-8111-000000000106'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), 'Taylor Tractor Demo', 'taylor.tractor.demo@example.test', null, 'standard', true),
  ('11111111-1111-4111-8111-000000000107'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), 'Casey Winch Demo', 'casey.winch.demo@example.test', null, 'standard', true),
  ('11111111-1111-4111-8111-000000000108'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), 'Jordan Davit Demo', 'jordan.davit.demo@example.test', null, 'standard', true),
  ('11111111-1111-4111-8111-000000000109'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), 'Morgan Hovercraft Demo', 'morgan.hoverpilot.demo@example.test', null, 'standard', true),
  ('11111111-1111-4111-8111-00000000010a'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), 'Robin Shore Demo', 'robin.shore.demo@example.test', null, 'standard', true),
  ('11111111-1111-4111-8111-00000000010b'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), 'DLA Day Demo', 'dla.day.demo@example.test', null, 'standard', true),
  ('11111111-1111-4111-8111-00000000010c'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), 'DLA Night Demo', 'dla.night.demo@example.test', null, 'standard', true)
on conflict (id) do update
set
  organisation_id = excluded.organisation_id,
  display_name = excluded.display_name,
  email = excluded.email,
  phone = excluded.phone,
  system_role = excluded.system_role,
  is_active = excluded.is_active,
  updated_at = now();

set local session_replication_role = origin;

insert into public.crew_types (id, code, name, description, is_active)
values
  ('22222222-2222-4222-8222-000000000201'::uuid, 'boat_crew', 'Boat Crew', 'Demo boat crew membership type.', true),
  ('22222222-2222-4222-8222-000000000202'::uuid, 'shore_crew', 'Shore Crew', 'Demo shore crew membership type.', true)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.operational_roles (id, code, name, description, category, is_active)
values
  ('33333333-3333-4333-8333-000000000301'::uuid, 'helm', 'Helm', 'Demo helm qualification.', 'operational', true),
  ('33333333-3333-4333-8333-000000000302'::uuid, 'tier_1', 'Tier 1', 'Demo tier 1 qualification.', 'operational', true),
  ('33333333-3333-4333-8333-000000000303'::uuid, 'tier_2', 'Tier 2', 'Demo tier 2 qualification.', 'operational', true),
  ('33333333-3333-4333-8333-000000000304'::uuid, 'boat_crew', 'Boat Crew', 'Demo boat crew qualification.', 'operational', true),
  ('33333333-3333-4333-8333-000000000305'::uuid, 'navigator', 'Navigator', 'Demo navigator qualification.', 'operational', true),
  ('33333333-3333-4333-8333-000000000306'::uuid, 'commander', 'Commander', 'Demo hovercraft commander qualification.', 'operational', true),
  ('33333333-3333-4333-8333-000000000307'::uuid, 'pilot', 'Pilot', 'Demo hovercraft pilot qualification.', 'operational', true),
  ('33333333-3333-4333-8333-000000000308'::uuid, 'tractor_driver', 'Tractor Driver', 'Demo tractor driver qualification.', 'launch_recovery', true),
  ('33333333-3333-4333-8333-000000000309'::uuid, 'winch_operator', 'Winch Operator', 'Demo winch operator qualification.', 'launch_recovery', true),
  ('33333333-3333-4333-8333-00000000030a'::uuid, 'davit_operator', 'Davit Operator', 'Demo davit operator qualification.', 'launch_recovery', true),
  ('33333333-3333-4333-8333-00000000030b'::uuid, 'head_launcher', 'Head Launcher', 'Demo head launcher qualification.', 'launch_recovery', true),
  ('33333333-3333-4333-8333-00000000030c'::uuid, 'launcher', 'Launcher', 'Demo launcher qualification.', 'launch_recovery', true),
  ('33333333-3333-4333-8333-00000000030d'::uuid, 'shore_crew', 'Shore Crew', 'Demo shore support qualification.', 'shore', true),
  ('33333333-3333-4333-8333-00000000030e'::uuid, 'vehicle_driver', 'Vehicle Driver', 'Demo buggy / support vehicle driver qualification.', 'shore', true)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.qualification_types (id, code, name, kind, description, requires_expiry, is_active)
values
  ('44444444-4444-4444-8444-000000000401'::uuid, 'helm', 'Helm', 'operational', 'Demo helm qualification type.', false, true),
  ('44444444-4444-4444-8444-000000000402'::uuid, 'tier_1', 'Tier 1', 'operational', 'Demo tier 1 qualification type.', false, true),
  ('44444444-4444-4444-8444-000000000403'::uuid, 'tier_2', 'Tier 2', 'operational', 'Demo tier 2 qualification type.', false, true),
  ('44444444-4444-4444-8444-000000000404'::uuid, 'boat_crew', 'Boat Crew', 'operational', 'Demo boat crew qualification type.', false, true),
  ('44444444-4444-4444-8444-000000000405'::uuid, 'navigator', 'Navigator', 'operational', 'Demo navigator qualification type.', false, true),
  ('44444444-4444-4444-8444-000000000406'::uuid, 'commander', 'Commander', 'operational', 'Demo commander qualification type.', false, true),
  ('44444444-4444-4444-8444-000000000407'::uuid, 'pilot', 'Pilot', 'operational', 'Demo pilot qualification type.', false, true),
  ('44444444-4444-4444-8444-000000000408'::uuid, 'tractor_driver', 'Tractor Driver', 'operational', 'Demo tractor driver qualification type.', false, true),
  ('44444444-4444-4444-8444-000000000409'::uuid, 'winch_operator', 'Winch Operator', 'operational', 'Demo winch operator qualification type.', false, true),
  ('44444444-4444-4444-8444-00000000040a'::uuid, 'davit_operator', 'Davit Operator', 'operational', 'Demo davit operator qualification type.', false, true),
  ('44444444-4444-4444-8444-00000000040b'::uuid, 'head_launcher', 'Head Launcher', 'operational', 'Demo head launcher qualification type.', false, true),
  ('44444444-4444-4444-8444-00000000040c'::uuid, 'launcher', 'Launcher', 'operational', 'Demo launcher qualification type.', false, true),
  ('44444444-4444-4444-8444-00000000040d'::uuid, 'shore_crew', 'Shore Crew', 'operational', 'Demo shore crew qualification type.', false, true),
  ('44444444-4444-4444-8444-00000000040e'::uuid, 'vehicle_driver', 'Vehicle Driver', 'operational', 'Demo buggy / support vehicle driver qualification type.', false, true),
  ('44444444-4444-4444-8444-0000000004ff'::uuid, 'casualty_care', 'Casualty Care', 'casualty_care', 'Demo casualty care qualification type.', true, true)
on conflict (code) do update
set
  name = excluded.name,
  kind = excluded.kind,
  description = excluded.description,
  requires_expiry = excluded.requires_expiry,
  is_active = excluded.is_active,
  updated_at = now();

with demo_context as (
  select
    o.id as organisation_id,
    s.id as station_id
  from public.organisations o
  join public.stations s on s.organisation_id = o.id
  where o.slug = 'launch-ready-demo'
    and s.slug = 'southend-lifeboat-station'
),
membership_rows (
  row_id,
  profile_id,
  membership_role,
  crew_type_code,
  is_primary
) as (
  values
    ('55555555-5555-4555-8555-000000000501'::uuid, '11111111-1111-4111-8111-000000000101'::uuid, 'crew'::public.station_membership_role, 'boat_crew'::text, true),
    ('55555555-5555-4555-8555-000000000502'::uuid, '11111111-1111-4111-8111-000000000102'::uuid, 'crew'::public.station_membership_role, 'boat_crew'::text, true),
    ('55555555-5555-4555-8555-000000000503'::uuid, '11111111-1111-4111-8111-000000000103'::uuid, 'crew'::public.station_membership_role, 'boat_crew'::text, true),
    ('55555555-5555-4555-8555-000000000504'::uuid, '11111111-1111-4111-8111-000000000104'::uuid, 'crew'::public.station_membership_role, 'boat_crew'::text, true),
    ('55555555-5555-4555-8555-000000000505'::uuid, '11111111-1111-4111-8111-000000000105'::uuid, 'lom'::public.station_membership_role, 'shore_crew'::text, true),
    ('55555555-5555-4555-8555-000000000506'::uuid, '11111111-1111-4111-8111-000000000106'::uuid, 'crew'::public.station_membership_role, 'shore_crew'::text, true),
    ('55555555-5555-4555-8555-000000000507'::uuid, '11111111-1111-4111-8111-000000000107'::uuid, 'crew'::public.station_membership_role, 'shore_crew'::text, true),
    ('55555555-5555-4555-8555-000000000508'::uuid, '11111111-1111-4111-8111-000000000108'::uuid, 'crew'::public.station_membership_role, 'shore_crew'::text, true),
    ('55555555-5555-4555-8555-000000000509'::uuid, '11111111-1111-4111-8111-000000000109'::uuid, 'crew'::public.station_membership_role, 'boat_crew'::text, true),
    ('55555555-5555-4555-8555-00000000050a'::uuid, '11111111-1111-4111-8111-00000000010a'::uuid, 'crew'::public.station_membership_role, 'shore_crew'::text, true),
    ('55555555-5555-4555-8555-00000000050b'::uuid, '11111111-1111-4111-8111-00000000010b'::uuid, 'dla'::public.station_membership_role, 'shore_crew'::text, true),
    ('55555555-5555-4555-8555-00000000050c'::uuid, '11111111-1111-4111-8111-00000000010c'::uuid, 'dla'::public.station_membership_role, 'shore_crew'::text, true)
)
insert into public.station_memberships (
  id,
  profile_id,
  station_id,
  crew_type_id,
  membership_role,
  is_primary,
  is_active
)
select
  mr.row_id::uuid,
  mr.profile_id::uuid,
  dc.station_id::uuid,
  ct.id::uuid,
  mr.membership_role,
  mr.is_primary,
  true
from membership_rows mr
cross join demo_context dc
join public.crew_types ct on ct.code = mr.crew_type_code
on conflict (profile_id, station_id, membership_role, crew_type_id) do update
set
  is_primary = excluded.is_primary,
  is_active = excluded.is_active,
  updated_at = now();

with demo_context as (
  select
    o.id as organisation_id,
    s.id as station_id
  from public.organisations o
  join public.stations s on s.organisation_id = o.id
  where o.slug = 'launch-ready-demo'
    and s.slug = 'southend-lifeboat-station'
),
asset_lookup as (
  select
    a.id as asset_id,
    a.name as asset_name,
    a.asset_type_id,
    sl.name as location_name
  from public.assets a
  join public.station_locations sl on sl.id = a.station_location_id
  join demo_context dc on dc.station_id = a.station_id
),
qualification_rows (
  row_id,
  profile_id,
  qualification_type_code,
  asset_location_name,
  asset_name,
  role_code,
  currency_state,
  starts_on,
  expires_on,
  verified_at,
  notes,
  is_active
) as (
  values
    ('66666666-6666-4666-8666-000000000601'::uuid, '11111111-1111-4111-8111-000000000101'::uuid, 'helm', 'Inshore Station', 'D Class', 'helm', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO inshore D Class helm.', true),
    ('66666666-6666-4666-8666-000000000602'::uuid, '11111111-1111-4111-8111-000000000102'::uuid, 'helm', 'Inshore Station', 'D Class', 'helm', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO inshore D Class helm.', true),
    ('66666666-6666-4666-8666-000000000603'::uuid, '11111111-1111-4111-8111-000000000101'::uuid, 'tier_1', 'Inshore Station', 'D Class', 'tier_1', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO inshore D Class tier 1.', true),
    ('66666666-6666-4666-8666-000000000604'::uuid, '11111111-1111-4111-8111-000000000103'::uuid, 'tier_1', 'Inshore Station', 'D Class', 'tier_1', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO inshore D Class tier 1.', true),
    ('66666666-6666-4666-8666-000000000605'::uuid, '11111111-1111-4111-8111-000000000102'::uuid, 'tier_1', 'Offshore / Pier Station', 'B Class', 'tier_1', 'amber'::public.currency_state, current_date - 30, null::date, now(), 'DEMO offshore B Class tier 1 amber warning.', true),
    ('66666666-6666-4666-8666-000000000606'::uuid, '11111111-1111-4111-8111-000000000103'::uuid, 'tier_2', 'Inshore Station', 'D Class', 'tier_2', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO inshore D Class tier 2.', true),
    ('66666666-6666-4666-8666-000000000607'::uuid, '11111111-1111-4111-8111-000000000104'::uuid, 'tier_2', 'Offshore / Pier Station', 'B Class', 'tier_2', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO offshore B Class tier 2.', true),
    ('66666666-6666-4666-8666-000000000608'::uuid, '11111111-1111-4111-8111-000000000101'::uuid, 'boat_crew', 'Inshore Station', 'D Class', 'boat_crew', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO inshore D Class boat crew.', true),
    ('66666666-6666-4666-8666-000000000609'::uuid, '11111111-1111-4111-8111-000000000104'::uuid, 'navigator', 'Offshore / Pier Station', 'B Class', 'navigator', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO offshore B Class navigator.', true),
    ('66666666-6666-4666-8666-00000000060a'::uuid, '11111111-1111-4111-8111-000000000109'::uuid, 'boat_crew', 'Inshore Station', 'Hovercraft', 'boat_crew', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO hovercraft crew.', true),
    ('66666666-6666-4666-8666-00000000060b'::uuid, '11111111-1111-4111-8111-000000000109'::uuid, 'commander', 'Inshore Station', 'Hovercraft', 'commander', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO hovercraft commander.', true),
    ('66666666-6666-4666-8666-00000000060c'::uuid, '11111111-1111-4111-8111-000000000109'::uuid, 'pilot', 'Inshore Station', 'Hovercraft', 'pilot', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO hovercraft pilot.', true),
    ('66666666-6666-4666-8666-00000000060d'::uuid, '11111111-1111-4111-8111-000000000106'::uuid, 'tractor_driver', 'Inshore Station', 'Tractor', 'tractor_driver', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO tractor driver.', true),
    ('66666666-6666-4666-8666-00000000060e'::uuid, '11111111-1111-4111-8111-000000000107'::uuid, 'tractor_driver', 'Inshore Station', 'Tractor', 'tractor_driver', 'red'::public.currency_state, current_date - 30, null::date, now(), 'DEMO tractor driver red warning.', true),
    ('66666666-6666-4666-8666-00000000060f'::uuid, '11111111-1111-4111-8111-000000000107'::uuid, 'winch_operator', 'Inshore Station', 'Winch', 'winch_operator', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO winch operator.', true),
    ('66666666-6666-4666-8666-000000000610'::uuid, '11111111-1111-4111-8111-00000000010a'::uuid, 'winch_operator', 'Inshore Station', 'Winch', 'winch_operator', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO winch operator.', true),
    ('66666666-6666-4666-8666-000000000611'::uuid, '11111111-1111-4111-8111-000000000108'::uuid, 'davit_operator', 'Offshore / Pier Station', 'Davit', 'davit_operator', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO davit operator.', true),
    ('66666666-6666-4666-8666-000000000612'::uuid, '11111111-1111-4111-8111-000000000105'::uuid, 'davit_operator', 'Offshore / Pier Station', 'Davit', 'davit_operator', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO davit operator and head launcher.', true),
    ('66666666-6666-4666-8666-000000000613'::uuid, '11111111-1111-4111-8111-000000000105'::uuid, 'head_launcher', null::text, null::text, 'head_launcher', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO head launcher qualification.', true),
    ('66666666-6666-4666-8666-000000000614'::uuid, '11111111-1111-4111-8111-00000000010a'::uuid, 'head_launcher', null::text, null::text, 'head_launcher', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO head launcher qualification.', true),
    ('66666666-6666-4666-8666-000000000615'::uuid, '11111111-1111-4111-8111-000000000105'::uuid, 'launcher', null::text, null::text, 'launcher', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO launcher qualification.', true),
    ('66666666-6666-4666-8666-000000000616'::uuid, '11111111-1111-4111-8111-00000000010a'::uuid, 'launcher', null::text, null::text, 'launcher', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO launcher qualification.', true),
    ('66666666-6666-4666-8666-000000000617'::uuid, '11111111-1111-4111-8111-000000000105'::uuid, 'shore_crew', null::text, null::text, 'shore_crew', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO shore crew qualification.', true),
    ('66666666-6666-4666-8666-000000000618'::uuid, '11111111-1111-4111-8111-00000000010a'::uuid, 'shore_crew', null::text, null::text, 'shore_crew', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO shore crew qualification.', true),
    ('66666666-6666-4666-8666-000000000619'::uuid, '11111111-1111-4111-8111-00000000010a'::uuid, 'vehicle_driver', 'Inshore Station', 'RNLI Buggy 2', 'vehicle_driver', 'amber'::public.currency_state, current_date - 30, null::date, now(), 'DEMO vehicle driver amber warning.', true),
    ('66666666-6666-4666-8666-00000000061a'::uuid, '11111111-1111-4111-8111-000000000106'::uuid, 'vehicle_driver', 'Inshore Station', 'RNLI Buggy 1', 'vehicle_driver', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO buggy driver.', true),
    ('66666666-6666-4666-8666-00000000061b'::uuid, '11111111-1111-4111-8111-00000000010b'::uuid, 'casualty_care', null::text, null::text, null::text, 'green'::public.currency_state, current_date - 90, null::date, now(), 'DEMO casualty care current for DLA day.', true),
    ('66666666-6666-4666-8666-00000000061c'::uuid, '11111111-1111-4111-8111-00000000010c'::uuid, 'casualty_care', null::text, null::text, null::text, 'red'::public.currency_state, current_date - 365, current_date - 1, now(), 'DEMO casualty care expired for DLA night.', true),
    ('66666666-6666-4666-8666-00000000061d'::uuid, '11111111-1111-4111-8111-000000000101'::uuid, 'helm', 'Offshore / Pier Station', 'B Class', 'helm', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO offshore B Class helm.', true),
    ('66666666-6666-4666-8666-00000000061e'::uuid, '11111111-1111-4111-8111-000000000102'::uuid, 'helm', 'Offshore / Pier Station', 'B Class', 'helm', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO offshore B Class helm.', true),
    ('66666666-6666-4666-8666-00000000061f'::uuid, '11111111-1111-4111-8111-000000000103'::uuid, 'tier_1', 'Offshore / Pier Station', 'B Class', 'tier_1', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO offshore B Class tier 1.', true),
    ('66666666-6666-4666-8666-000000000620'::uuid, '11111111-1111-4111-8111-000000000104'::uuid, 'tier_2', 'Inshore Station', 'D Class', 'tier_2', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO inshore D Class tier 2.', true),
    ('66666666-6666-4666-8666-000000000621'::uuid, '11111111-1111-4111-8111-000000000103'::uuid, 'tier_2', 'Offshore / Pier Station', 'B Class', 'tier_2', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO offshore B Class tier 2.', true),
    ('66666666-6666-4666-8666-000000000622'::uuid, '11111111-1111-4111-8111-000000000104'::uuid, 'boat_crew', 'Offshore / Pier Station', 'D Class', 'boat_crew', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO offshore D Class boat crew.', true),
    ('66666666-6666-4666-8666-000000000623'::uuid, '11111111-1111-4111-8111-000000000109'::uuid, 'boat_crew', 'Offshore / Pier Station', 'D Class', 'boat_crew', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO offshore D Class boat crew.', true),
    ('66666666-6666-4666-8666-000000000624'::uuid, '11111111-1111-4111-8111-00000000010a'::uuid, 'tractor_driver', 'Inshore Station', 'Tractor', 'tractor_driver', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO second tractor driver.', true),
    ('66666666-6666-4666-8666-000000000625'::uuid, '11111111-1111-4111-8111-000000000109'::uuid, 'vehicle_driver', 'Inshore Station', 'RNLI Buggy 2', 'vehicle_driver', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO buggy driver.', true),
    ('66666666-6666-4666-8666-000000000626'::uuid, '11111111-1111-4111-8111-000000000104'::uuid, 'vehicle_driver', 'Inshore Station', 'RNLI Buggy 1', 'vehicle_driver', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO buggy driver.', true),
    ('66666666-6666-4666-8666-000000000627'::uuid, '11111111-1111-4111-8111-00000000010a'::uuid, 'boat_crew', 'Inshore Station', 'Hovercraft', 'boat_crew', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO hovercraft crew.', true),
    ('66666666-6666-4666-8666-000000000628'::uuid, '11111111-1111-4111-8111-000000000104'::uuid, 'tier_2', 'Inshore Station', 'D Class', 'tier_2', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO additional inshore D Class tier 2.', true),
    ('66666666-6666-4666-8666-000000000629'::uuid, '11111111-1111-4111-8111-000000000109'::uuid, 'boat_crew', 'Inshore Station', 'D Class', 'boat_crew', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO second inshore D Class boat crew.', true),
    ('66666666-6666-4666-8666-00000000062a'::uuid, '11111111-1111-4111-8111-000000000101'::uuid, 'helm', 'Offshore / Pier Station', 'D Class', 'helm', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO offshore D Class helm.', true),
    ('66666666-6666-4666-8666-00000000062b'::uuid, '11111111-1111-4111-8111-000000000103'::uuid, 'tier_2', 'Offshore / Pier Station', 'D Class', 'tier_2', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO offshore D Class tier 2.', true),
    ('66666666-6666-4666-8666-00000000062c'::uuid, '11111111-1111-4111-8111-000000000101'::uuid, 'tier_1', 'Offshore / Pier Station', 'B Class', 'tier_1', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO offshore B Class tier 1.', true),
    ('66666666-6666-4666-8666-00000000062d'::uuid, '11111111-1111-4111-8111-000000000104'::uuid, 'boat_crew', 'Offshore / Pier Station', 'D Class', 'boat_crew', 'green'::public.currency_state, current_date - 30, null::date, now(), 'DEMO additional offshore D Class boat crew.', true)
)
insert into public.crew_qualifications (
  id,
  profile_id,
  station_id,
  qualification_type_id,
  asset_type_id,
  asset_id,
  operational_role_id,
  currency_state,
  starts_on,
  expires_on,
  verified_at,
  verified_by,
  notes,
  is_active
)
select
  qr.row_id::uuid,
  qr.profile_id::uuid,
  dc.station_id::uuid,
  qt.id::uuid as qualification_type_id,
  al.asset_type_id::uuid,
  al.asset_id::uuid,
  orole.id::uuid as operational_role_id,
  qr.currency_state,
  qr.starts_on,
  qr.expires_on,
  qr.verified_at,
  null::uuid as verified_by,
  qr.notes,
  qr.is_active
from qualification_rows qr
cross join demo_context dc
join public.qualification_types qt on qt.code = qr.qualification_type_code
left join asset_lookup al
  on qr.asset_location_name is not null
  and qr.asset_name is not null
  and al.location_name = qr.asset_location_name
  and al.asset_name = qr.asset_name
left join public.operational_roles orole on orole.code = qr.role_code
on conflict (id) do update
set
  profile_id = excluded.profile_id,
  station_id = excluded.station_id,
  qualification_type_id = excluded.qualification_type_id,
  asset_type_id = excluded.asset_type_id,
  asset_id = excluded.asset_id,
  operational_role_id = excluded.operational_role_id,
  currency_state = excluded.currency_state,
  starts_on = excluded.starts_on,
  expires_on = excluded.expires_on,
  verified_at = excluded.verified_at,
  verified_by = excluded.verified_by,
  notes = excluded.notes,
  is_active = excluded.is_active,
  updated_at = now();

with demo_context as (
  select
    o.id as organisation_id,
    s.id as station_id
  from public.organisations o
  join public.stations s on s.organisation_id = o.id
  where o.slug = 'launch-ready-demo'
    and s.slug = 'southend-lifeboat-station'
),
location_lookup as (
  select sl.id, sl.name
  from public.station_locations sl
  join demo_context dc on dc.station_id = sl.station_id
),
availability_rows (
  row_id,
  profile_id,
  slot_kind,
  station_location_name,
  coverage_date,
  start_time,
  end_time,
  days_of_week,
  is_recurring,
  is_active,
  notes,
  starts_at,
  ends_at,
  created_by_profile_id
) as (
  values
    ('77777777-7777-4777-8777-000000000701'::uuid, '11111111-1111-4111-8111-000000000101'::uuid, 'full_day'::public.availability_slot_kind, 'Inshore Station', null::date, time '07:00', time '19:00', ARRAY[]::smallint[], false, true, 'DEMO available now.', now() - interval '1 hour', now() + interval '8 hours', '11111111-1111-4111-8111-000000000105'::uuid),
    ('77777777-7777-4777-8777-000000000702'::uuid, '11111111-1111-4111-8111-000000000102'::uuid, 'partial_day'::public.availability_slot_kind, 'Inshore Station', null::date, time '09:00', time '13:00', ARRAY[]::smallint[], false, true, 'DEMO later today.', now() + interval '2 hours', now() + interval '6 hours', '11111111-1111-4111-8111-000000000105'::uuid),
    ('77777777-7777-4777-8777-000000000703'::uuid, '11111111-1111-4111-8111-000000000103'::uuid, 'night_cover'::public.availability_slot_kind, 'Offshore / Pier Station', null::date, time '19:00', time '07:00', ARRAY[]::smallint[], false, true, 'DEMO tonight.', now() + interval '8 hours', now() + interval '18 hours', '11111111-1111-4111-8111-000000000105'::uuid),
    ('77777777-7777-4777-8777-000000000704'::uuid, '11111111-1111-4111-8111-000000000104'::uuid, 'unavailable'::public.availability_slot_kind, 'Offshore / Pier Station', null::date, time '07:00', time '12:00', ARRAY[]::smallint[], false, true, 'DEMO unavailable now.', now() - interval '1 hour', now() + interval '2 hours', '11111111-1111-4111-8111-00000000010a'::uuid),
    ('77777777-7777-4777-8777-000000000705'::uuid, '11111111-1111-4111-8111-000000000106'::uuid, 'full_day'::public.availability_slot_kind, 'Inshore Station', null::date, time '07:00', time '19:00', ARRAY[]::smallint[], false, true, 'DEMO available now.', now() - interval '1 hour', now() + interval '8 hours', '11111111-1111-4111-8111-000000000105'::uuid),
    ('77777777-7777-4777-8777-000000000706'::uuid, '11111111-1111-4111-8111-000000000107'::uuid, 'unavailable'::public.availability_slot_kind, 'Inshore Station', null::date, time '07:00', time '12:00', ARRAY[]::smallint[], false, true, 'DEMO unavailable now.', now() - interval '2 hours', now() + interval '2 hours', '11111111-1111-4111-8111-000000000105'::uuid),
    ('77777777-7777-4777-8777-000000000707'::uuid, '11111111-1111-4111-8111-000000000108'::uuid, 'night_cover'::public.availability_slot_kind, 'Offshore / Pier Station', null::date, time '19:00', time '07:00', ARRAY[]::smallint[], false, true, 'DEMO tonight.', now() + interval '8 hours', now() + interval '18 hours', '11111111-1111-4111-8111-000000000105'::uuid),
    ('77777777-7777-4777-8777-000000000708'::uuid, '11111111-1111-4111-8111-000000000109'::uuid, 'full_day'::public.availability_slot_kind, 'Inshore Station', null::date, time '07:00', time '19:00', ARRAY[]::smallint[], false, true, 'DEMO available now.', now() - interval '1 hour', now() + interval '8 hours', '11111111-1111-4111-8111-000000000105'::uuid),
    ('77777777-7777-4777-8777-000000000709'::uuid, '11111111-1111-4111-8111-00000000010a'::uuid, 'weekend_unavailable'::public.availability_slot_kind, 'Inshore Station', null::date, time '19:00', time '07:00', ARRAY[]::smallint[], false, true, 'DEMO weekend unavailable.', now() + interval '5 days 19 hours', now() + interval '8 days 7 hours', '11111111-1111-4111-8111-000000000105'::uuid),
    ('77777777-7777-4777-8777-00000000070a'::uuid, '11111111-1111-4111-8111-00000000010b'::uuid, 'full_day'::public.availability_slot_kind, 'Inshore Station', null::date, time '07:00', time '19:00', ARRAY[]::smallint[], false, true, 'DEMO DLA day cover.', now() + interval '1 hour', now() + interval '9 hours', '11111111-1111-4111-8111-000000000105'::uuid),
    ('77777777-7777-4777-8777-00000000070b'::uuid, '11111111-1111-4111-8111-00000000010c'::uuid, 'night_cover'::public.availability_slot_kind, 'Offshore / Pier Station', null::date, time '19:00', time '07:00', ARRAY[]::smallint[], false, true, 'DEMO DLA night cover.', now() + interval '9 hours', now() + interval '19 hours', '11111111-1111-4111-8111-000000000105'::uuid)
)
insert into public.availability_slots (
  id,
  profile_id,
  station_id,
  station_location_id,
  asset_type_id,
  asset_id,
  operational_role_id,
  slot_kind,
  coverage_date,
  start_time,
  end_time,
  days_of_week,
  is_recurring,
  is_active,
  notes,
  starts_at,
  ends_at,
  created_by_profile_id
)
select
  ar.row_id::uuid,
  ar.profile_id::uuid,
  dc.station_id::uuid,
  ll.id::uuid as station_location_id,
  null::uuid,
  null::uuid,
  null::uuid,
  ar.slot_kind,
  ar.coverage_date,
  ar.start_time,
  ar.end_time,
  ar.days_of_week,
  ar.is_recurring,
  ar.is_active,
  ar.notes,
  ar.starts_at,
  ar.ends_at,
  ar.created_by_profile_id::uuid
from availability_rows ar
cross join demo_context dc
left join location_lookup ll on ll.name = ar.station_location_name
on conflict (id) do update
set
  profile_id = excluded.profile_id,
  station_id = excluded.station_id,
  station_location_id = excluded.station_location_id,
  asset_type_id = excluded.asset_type_id,
  asset_id = excluded.asset_id,
  operational_role_id = excluded.operational_role_id,
  slot_kind = excluded.slot_kind,
  coverage_date = excluded.coverage_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  days_of_week = excluded.days_of_week,
  is_recurring = excluded.is_recurring,
  is_active = excluded.is_active,
  notes = excluded.notes,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  created_by_profile_id = excluded.created_by_profile_id,
  updated_at = now();

with demo_context as (
  select
    o.id as organisation_id,
    s.id as station_id
  from public.organisations o
  join public.stations s on s.organisation_id = o.id
  where o.slug = 'launch-ready-demo'
    and s.slug = 'southend-lifeboat-station'
),
location_lookup as (
  select sl.id, sl.name
  from public.station_locations sl
  join demo_context dc on dc.station_id = sl.station_id
),
duty_rows (
  row_id,
  profile_id,
  period_kind,
  station_location_name,
  duty_date,
  start_time,
  end_time,
  source,
  notes,
  is_active,
  starts_at,
  ends_at,
  created_by_profile_id
) as (
  values
    ('88888888-8888-4888-8888-000000000801'::uuid, '11111111-1111-4111-8111-000000000105'::uuid, 'day_cover'::public.duty_period_kind, 'Inshore Station', current_date, time '07:00', time '19:00', 'manual', 'DEMO current day cover.', true, now() - interval '1 hour', now() + interval '7 hours', '11111111-1111-4111-8111-000000000105'::uuid),
    ('88888888-8888-4888-8888-000000000802'::uuid, '11111111-1111-4111-8111-00000000010b'::uuid, 'dla_day'::public.duty_period_kind, 'Inshore Station', current_date, time '07:00', time '19:00', 'manual', 'DEMO DLA day duty.', true, now() + interval '1 hour', now() + interval '9 hours', '11111111-1111-4111-8111-00000000010b'::uuid),
    ('88888888-8888-4888-8888-000000000803'::uuid, '11111111-1111-4111-8111-00000000010c'::uuid, 'dla_night'::public.duty_period_kind, 'Offshore / Pier Station', current_date, time '19:00', time '07:00', 'manual', 'DEMO DLA night duty.', true, now() + interval '9 hours', now() + interval '19 hours', '11111111-1111-4111-8111-00000000010c'::uuid),
    ('88888888-8888-4888-8888-000000000804'::uuid, '11111111-1111-4111-8111-000000000105'::uuid, 'weekend_cover'::public.duty_period_kind, 'Inshore Station', current_date + 5, time '19:00', time '07:00', 'manual', 'DEMO upcoming weekend cover.', true, now() + interval '5 days 19 hours', now() + interval '8 days 7 hours', '11111111-1111-4111-8111-000000000105'::uuid),
    ('88888888-8888-4888-8888-000000000805'::uuid, '11111111-1111-4111-8111-000000000106'::uuid, 'night_cover'::public.duty_period_kind, 'Inshore Station', current_date, time '19:00', time '07:00', 'manual', 'DEMO current night cover.', true, now() + interval '8 hours', now() + interval '18 hours', '11111111-1111-4111-8111-000000000106'::uuid)
)
insert into public.duty_periods (
  id,
  station_id,
  profile_id,
  station_location_id,
  asset_type_id,
  asset_id,
  operational_role_id,
  period_kind,
  duty_date,
  start_time,
  end_time,
  source,
  notes,
  is_active,
  starts_at,
  ends_at,
  created_by_profile_id
)
select
  dr.row_id::uuid,
  dc.station_id::uuid,
  dr.profile_id::uuid,
  ll.id::uuid as station_location_id,
  null::uuid,
  null::uuid,
  null::uuid,
  dr.period_kind,
  dr.duty_date,
  dr.start_time,
  dr.end_time,
  dr.source,
  dr.notes,
  dr.is_active,
  dr.starts_at,
  dr.ends_at,
  dr.created_by_profile_id::uuid
from duty_rows dr
cross join demo_context dc
left join location_lookup ll on ll.name = dr.station_location_name
on conflict (id) do update
set
  station_id = excluded.station_id,
  profile_id = excluded.profile_id,
  station_location_id = excluded.station_location_id,
  asset_type_id = excluded.asset_type_id,
  asset_id = excluded.asset_id,
  operational_role_id = excluded.operational_role_id,
  period_kind = excluded.period_kind,
  duty_date = excluded.duty_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  source = excluded.source,
  notes = excluded.notes,
  is_active = excluded.is_active,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  created_by_profile_id = excluded.created_by_profile_id,
  updated_at = now();

with demo_context as (
  select
    o.id as organisation_id,
    s.id as station_id
  from public.organisations o
  join public.stations s on s.organisation_id = o.id
  where o.slug = 'launch-ready-demo'
    and s.slug = 'southend-lifeboat-station'
),
asset_lookup as (
  select
    a.id as asset_id,
    a.name as asset_name,
    a.asset_type_id,
    sl.name as location_name
  from public.assets a
  join public.station_locations sl on sl.id = a.station_location_id
  join demo_context dc on dc.station_id = a.station_id
),
cover_rows (
  row_id,
  requester_profile_id,
  original_duty_period_id,
  asset_location_name,
  asset_name,
  role_code,
  crew_type_code,
  cover_type,
  starts_at,
  ends_at,
  status,
  urgency,
  reason,
  notes,
  accepted_by_profile_id,
  accepted_at,
  resolved_at
) as (
  values
    ('99999999-9999-4999-8999-000000000901'::uuid, '11111111-1111-4111-8111-000000000101'::uuid, '88888888-8888-4888-8888-000000000801'::uuid, 'Inshore Station', 'D Class', 'helm', 'boat_crew', 'custom'::public.cover_request_cover_type, now() + interval '1 hour', now() + interval '8 hours', 'open'::public.cover_request_status, 'urgent'::public.cover_request_urgency, 'DEMO urgent D Class helm cover request.', 'General station cover requested for the launch window.', null::uuid, null::timestamptz, null::timestamptz),
    ('99999999-9999-4999-8999-000000000902'::uuid, '11111111-1111-4111-8111-000000000105'::uuid, null::uuid, null::text, null::text, null::text, null::text, 'weekend'::public.cover_request_cover_type, now() + interval '5 days 19 hours', now() + interval '8 days 7 hours', 'open'::public.cover_request_status, 'normal'::public.cover_request_urgency, 'DEMO general station cover request.', 'Weekend coverage needed for the coming duty period.', null::uuid, null::timestamptz, null::timestamptz),
    ('99999999-9999-4999-8999-000000000903'::uuid, '11111111-1111-4111-8111-000000000102'::uuid, '88888888-8888-4888-8888-000000000804'::uuid, 'Offshore / Pier Station', 'B Class', 'tier_1', 'boat_crew', 'day'::public.cover_request_cover_type, now() + interval '2 hours', now() + interval '10 hours', 'accepted'::public.cover_request_status, 'normal'::public.cover_request_urgency, 'DEMO accepted B Class Tier 1 cover request.', 'Accepted and linked to demo response.', '11111111-1111-4111-8111-000000000103'::uuid, now() - interval '30 minutes', now() - interval '20 minutes'),
    ('99999999-9999-4999-8999-000000000904'::uuid, '11111111-1111-4111-8111-000000000106'::uuid, '88888888-8888-4888-8888-000000000805'::uuid, 'Inshore Station', 'Tractor', 'tractor_driver', 'shore_crew', 'custom'::public.cover_request_cover_type, now() - interval '3 days', now() - interval '2 days', 'cancelled'::public.cover_request_status, 'normal'::public.cover_request_urgency, 'DEMO cancelled/past cover request.', 'Closed out for testing.', null::uuid, null::timestamptz, now() - interval '2 days')
)
insert into public.cover_requests (
  id,
  station_id,
  requester_profile_id,
  original_duty_period_id,
  asset_id,
  operational_role_id,
  crew_type_id,
  cover_type,
  starts_at,
  ends_at,
  status,
  urgency,
  reason,
  notes,
  accepted_by_profile_id,
  accepted_at,
  resolved_at
)
select
  cr.row_id::uuid,
  dc.station_id::uuid,
  cr.requester_profile_id::uuid,
  cr.original_duty_period_id::uuid,
  al.asset_id::uuid,
  orole.id::uuid,
  ctype.id::uuid,
  cr.cover_type,
  cr.starts_at,
  cr.ends_at,
  cr.status,
  cr.urgency,
  cr.reason,
  cr.notes,
  cr.accepted_by_profile_id::uuid,
  cr.accepted_at,
  cr.resolved_at
from cover_rows cr
cross join demo_context dc
left join asset_lookup al
  on cr.asset_location_name is not null
  and cr.asset_name is not null
  and al.location_name = cr.asset_location_name
  and al.asset_name = cr.asset_name
left join public.operational_roles orole on orole.code = cr.role_code
left join public.crew_types ctype on ctype.code = cr.crew_type_code
on conflict (id) do update
set
  station_id = excluded.station_id,
  requester_profile_id = excluded.requester_profile_id,
  original_duty_period_id = excluded.original_duty_period_id,
  asset_id = excluded.asset_id,
  operational_role_id = excluded.operational_role_id,
  crew_type_id = excluded.crew_type_id,
  cover_type = excluded.cover_type,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  status = excluded.status,
  urgency = excluded.urgency,
  reason = excluded.reason,
  notes = excluded.notes,
  accepted_by_profile_id = excluded.accepted_by_profile_id,
  accepted_at = excluded.accepted_at,
  resolved_at = excluded.resolved_at,
  updated_at = now();

insert into public.cover_request_responses (
  id,
  cover_request_id,
  responder_profile_id,
  response_status,
  eligibility_status,
  eligibility_notes,
  notes,
  responded_at
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000a01'::uuid, '99999999-9999-4999-8999-000000000901'::uuid, '11111111-1111-4111-8111-000000000102'::uuid, 'offered', 'eligible', 'DEMO like-for-like eligible response.', 'Available to cover the D Class helm request.', now() - interval '30 minutes'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000a02'::uuid, '99999999-9999-4999-8999-000000000903'::uuid, '11111111-1111-4111-8111-000000000103'::uuid, 'accepted', 'eligible', 'DEMO accepted cover response.', 'Accepted the B Class Tier 1 cover request.', now() - interval '20 minutes')
on conflict (cover_request_id, responder_profile_id) do update
set
  response_status = excluded.response_status,
  eligibility_status = excluded.eligibility_status,
  eligibility_notes = excluded.eligibility_notes,
  notes = excluded.notes,
  responded_at = excluded.responded_at,
  updated_at = now();

insert into public.notifications (
  id,
  organisation_id,
  station_id,
  recipient_profile_id,
  channel,
  notification_type,
  title,
  body,
  priority,
  status,
  related_table,
  related_id,
  created_by_profile_id,
  scheduled_for,
  sent_at
)
values
  ('eeeeeeee-eeee-4eee-8eee-000000000e01'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), (select id from public.stations where slug = 'southend-lifeboat-station'), '11111111-1111-4111-8111-000000000101'::uuid, 'in_app', 'cover_request_created', 'Demo cover request created', 'DEMO cover request created for browser testing.', 1, 'queued', 'cover_requests', '99999999-9999-4999-8999-000000000901'::uuid, '11111111-1111-4111-8111-000000000105'::uuid, null, null),
  ('eeeeeeee-eeee-4eee-8eee-000000000e02'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), (select id from public.stations where slug = 'southend-lifeboat-station'), '11111111-1111-4111-8111-000000000105'::uuid, 'in_app', 'cover_request_created', 'Demo general cover request', 'DEMO general cover request created for browser testing.', 1, 'queued', 'cover_requests', '99999999-9999-4999-8999-000000000902'::uuid, '11111111-1111-4111-8111-000000000105'::uuid, null, null),
  ('eeeeeeee-eeee-4eee-8eee-000000000e03'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), (select id from public.stations where slug = 'southend-lifeboat-station'), '11111111-1111-4111-8111-000000000102'::uuid, 'in_app', 'cover_request_accepted', 'Demo cover request accepted', 'DEMO accepted cover request created for browser testing.', 2, 'queued', 'cover_requests', '99999999-9999-4999-8999-000000000903'::uuid, '11111111-1111-4111-8111-000000000105'::uuid, null, null),
  ('eeeeeeee-eeee-4eee-8eee-000000000e04'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), (select id from public.stations where slug = 'southend-lifeboat-station'), '11111111-1111-4111-8111-000000000106'::uuid, 'in_app', 'cover_request_cancelled', 'Demo cover request cancelled', 'DEMO cancelled/past cover request created for browser testing.', 0, 'queued', 'cover_requests', '99999999-9999-4999-8999-000000000904'::uuid, '11111111-1111-4111-8111-000000000105'::uuid, null, null)
on conflict (id) do update
set
  organisation_id = excluded.organisation_id,
  station_id = excluded.station_id,
  recipient_profile_id = excluded.recipient_profile_id,
  channel = excluded.channel,
  notification_type = excluded.notification_type,
  title = excluded.title,
  body = excluded.body,
  priority = excluded.priority,
  status = excluded.status,
  related_table = excluded.related_table,
  related_id = excluded.related_id,
  created_by_profile_id = excluded.created_by_profile_id,
  scheduled_for = excluded.scheduled_for,
  sent_at = excluded.sent_at,
  updated_at = now();

insert into public.audit_log (
  id,
  organisation_id,
  station_id,
  actor_profile_id,
  action,
  entity_table,
  entity_id,
  before_data,
  after_data,
  metadata
)
values
  ('ffffffff-ffff-4fff-8fff-000000000f01'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), (select id from public.stations where slug = 'southend-lifeboat-station'), '11111111-1111-4111-8111-00000000010b'::uuid, 'demo_cover_request_created', 'cover_requests', '99999999-9999-4999-8999-000000000901'::uuid, '{}'::jsonb, '{"demo": true}'::jsonb, '{"source": "supabase/demo-seed.sql"}'::jsonb),
  ('ffffffff-ffff-4fff-8fff-000000000f02'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), (select id from public.stations where slug = 'southend-lifeboat-station'), '11111111-1111-4111-8111-000000000105'::uuid, 'demo_cover_request_general_created', 'cover_requests', '99999999-9999-4999-8999-000000000902'::uuid, '{}'::jsonb, '{"demo": true}'::jsonb, '{"source": "supabase/demo-seed.sql"}'::jsonb),
  ('ffffffff-ffff-4fff-8fff-000000000f03'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), (select id from public.stations where slug = 'southend-lifeboat-station'), '11111111-1111-4111-8111-000000000102'::uuid, 'demo_cover_request_accepted', 'cover_requests', '99999999-9999-4999-8999-000000000903'::uuid, '{}'::jsonb, '{"demo": true}'::jsonb, '{"source": "supabase/demo-seed.sql"}'::jsonb),
  ('ffffffff-ffff-4fff-8fff-000000000f04'::uuid, (select id from public.organisations where slug = 'launch-ready-demo'), (select id from public.stations where slug = 'southend-lifeboat-station'), '11111111-1111-4111-8111-000000000106'::uuid, 'demo_cover_request_cancelled', 'cover_requests', '99999999-9999-4999-8999-000000000904'::uuid, '{}'::jsonb, '{"demo": true}'::jsonb, '{"source": "supabase/demo-seed.sql"}'::jsonb)
on conflict (id) do update
set
  organisation_id = excluded.organisation_id,
  station_id = excluded.station_id,
  actor_profile_id = excluded.actor_profile_id,
  action = excluded.action,
  entity_table = excluded.entity_table,
  entity_id = excluded.entity_id,
  before_data = excluded.before_data,
  after_data = excluded.after_data,
  metadata = excluded.metadata;

commit;
