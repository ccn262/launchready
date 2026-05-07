insert into public.organisations (name, slug, is_demo)
values ('Launch Ready Demo', 'launch-ready-demo', true)
on conflict (slug) do update
set name = excluded.name,
    is_demo = excluded.is_demo;

insert into public.stations (organisation_id, name, code, slug, is_active)
select o.id, 'Southend Lifeboat Station', 'SOUTHEND', 'southend-lifeboat-station', true
from public.organisations o
where o.slug = 'launch-ready-demo'
on conflict (organisation_id, slug) do update
set name = excluded.name,
    code = excluded.code,
    is_active = excluded.is_active;

insert into public.station_locations (station_id, name, slug, sort_order, is_active)
select s.id, 'Inshore Station', 'inshore-station', 1, true
from public.stations s
where s.slug = 'southend-lifeboat-station'
on conflict (station_id, slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

insert into public.station_locations (station_id, name, slug, sort_order, is_active)
select s.id, 'Offshore / Pier Station', 'offshore-pier-station', 2, true
from public.stations s
where s.slug = 'southend-lifeboat-station'
on conflict (station_id, slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

insert into public.asset_types (code, name, category, description, requires_recovery_equipment, is_active)
values
  ('tractor', 'Tractor', 'vehicle', 'Station launch and recovery tractor.', false, true),
  ('d-class-lifeboat', 'D Class', 'lifeboat', 'Inshore lifeboat asset.', false, true),
  ('hovercraft', 'Hovercraft', 'lifeboat', 'Air-cushion rescue craft.', true, true),
  ('rnli-buggy', 'RNLI Buggy', 'vehicle', 'Beach / pier support vehicle.', false, true),
  ('winch', 'Winch', 'launch_recovery', 'Launch and recovery winch equipment.', false, true),
  ('b-class-lifeboat', 'B Class', 'lifeboat', 'All-weather offshore lifeboat.', false, true),
  ('davit', 'Davit', 'launch_recovery', 'Pier launch and recovery davit.', false, true)
on conflict (code) do update
set name = excluded.name,
    category = excluded.category,
    description = excluded.description,
    requires_recovery_equipment = excluded.requires_recovery_equipment,
    is_active = excluded.is_active;

with station as (
  select id
  from public.stations
  where slug = 'southend-lifeboat-station'
),
locations as (
  select id, name
  from public.station_locations
  where station_id = (select id from station)
),
asset_type_lookup as (
  select id, code
  from public.asset_types
  where code in (
    'tractor',
    'd-class-lifeboat',
    'hovercraft',
    'rnli-buggy',
    'winch',
    'b-class-lifeboat',
    'davit'
  )
)
insert into public.assets (
  station_id,
  station_location_id,
  asset_type_id,
  name,
  asset_code,
  status,
  requires_recovery_support,
  metadata,
  is_active
)
select
  station.id,
  location.id,
  asset_type.id,
  asset_row.name,
  asset_row.asset_code,
  'ready',
  asset_row.requires_recovery_support,
  '{}'::jsonb,
  true
from station
join (
  values
    ('Inshore Station', 'tractor', 'Tractor', 'inshore-tractor', false),
    ('Inshore Station', 'd-class-lifeboat', 'D Class', 'inshore-d-class', false),
    ('Inshore Station', 'hovercraft', 'Hovercraft', 'inshore-hovercraft', true),
    ('Inshore Station', 'rnli-buggy', 'RNLI Buggy 1', 'inshore-rnli-buggy-1', false),
    ('Inshore Station', 'rnli-buggy', 'RNLI Buggy 2', 'inshore-rnli-buggy-2', false),
    ('Inshore Station', 'winch', 'Winch', 'inshore-winch', false),
    ('Offshore / Pier Station', 'd-class-lifeboat', 'D Class', 'offshore-d-class', false),
    ('Offshore / Pier Station', 'b-class-lifeboat', 'B Class', 'offshore-b-class', false),
    ('Offshore / Pier Station', 'davit', 'Davit', 'offshore-davit', false)
) as asset_row(location_name, asset_type_code, name, asset_code, requires_recovery_support)
  on true
join locations location on location.name = asset_row.location_name
join asset_type_lookup asset_type on asset_type.code = asset_row.asset_type_code
on conflict (station_id, asset_code) do update
set station_location_id = excluded.station_location_id,
    asset_type_id = excluded.asset_type_id,
    name = excluded.name,
    status = excluded.status,
    requires_recovery_support = excluded.requires_recovery_support,
    metadata = excluded.metadata,
    is_active = excluded.is_active;

insert into public.crew_types (code, name, description, is_active)
values
  ('boat_crew', 'Boat Crew', 'Crewing for afloat operational assets.', true),
  ('shore_crew', 'Shore Crew', 'Crewing for shore-based operational support.', true)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    is_active = excluded.is_active;

insert into public.operational_roles (code, name, description, category, is_active)
values
  ('dla', 'DLA', 'Duty launch authority.', 'command', true),
  ('lom', 'LOM', 'Launch authority and local management.', 'command', true),
  ('helm', 'Helm', 'Helmsman role for afloat assets.', 'operational', true),
  ('pilot', 'Pilot', 'Operational pilot / coxswain role.', 'operational', true),
  ('commander', 'Commander', 'Command role for operational control.', 'command', true),
  ('navigator', 'Navigator', 'Navigation and route planning role.', 'operational', true),
  ('tier_1', 'Tier 1', 'Tier 1 readiness role.', 'support', true),
  ('tier_2', 'Tier 2', 'Tier 2 readiness role.', 'support', true),
  ('boat_crew', 'Boat Crew', 'General afloat crew role.', 'operational', true),
  ('shore_crew', 'Shore Crew', 'General shore crew role.', 'support', true),
  ('tractor_driver', 'Tractor Driver', 'Vehicle and recovery tractor operator.', 'launch_recovery', true),
  ('winch_operator', 'Winch Operator', 'Winch operation and launch support role.', 'launch_recovery', true),
  ('davit_operator', 'Davit Operator', 'Pier davit launch support role.', 'launch_recovery', true),
  ('casualty_care', 'Casualty Care', 'Casualty care qualification role.', 'support', true)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    category = excluded.category,
    is_active = excluded.is_active;

insert into public.qualification_types (code, name, kind, description, requires_expiry, is_active)
values
  ('casualty_care', 'Casualty Care', 'casualty_care', 'Casualty care qualification and expiry tracking.', true, true)
on conflict (code) do update
set name = excluded.name,
    kind = excluded.kind,
    description = excluded.description,
    requires_expiry = excluded.requires_expiry,
    is_active = excluded.is_active;

insert into public.asset_role_qualifications (
  station_id,
  asset_type_id,
  operational_role_id,
  qualification_type_id,
  minimum_currency,
  requires_expiry,
  notes,
  is_active
)
select
  s.id,
  atype.id,
  role.id,
  null,
  'green',
  false,
  'Minimum operational role for the asset.',
  true
from public.stations s
join public.asset_types atype on atype.code = 'tractor'
join public.operational_roles role on role.code = 'tractor_driver'
where s.slug = 'southend-lifeboat-station'
on conflict do nothing;

insert into public.asset_role_qualifications (
  station_id,
  asset_type_id,
  operational_role_id,
  qualification_type_id,
  minimum_currency,
  requires_expiry,
  notes,
  is_active
)
select
  s.id,
  atype.id,
  role.id,
  null,
  'green',
  false,
  'Minimum operational role for the asset.',
  true
from public.stations s
join public.asset_types atype on atype.code in ('d-class-lifeboat', 'b-class-lifeboat')
join public.operational_roles role on role.code in ('helm', 'navigator', 'commander', 'boat_crew')
where s.slug = 'southend-lifeboat-station'
on conflict do nothing;

insert into public.asset_role_qualifications (
  station_id,
  asset_type_id,
  operational_role_id,
  qualification_type_id,
  minimum_currency,
  requires_expiry,
  notes,
  is_active
)
select
  s.id,
  atype.id,
  role.id,
  null,
  'green',
  false,
  'Launch / recovery support role.',
  true
from public.stations s
join public.asset_types atype on atype.code = 'hovercraft'
join public.operational_roles role on role.code = 'winch_operator'
where s.slug = 'southend-lifeboat-station'
on conflict do nothing;

insert into public.asset_role_qualifications (
  station_id,
  asset_type_id,
  operational_role_id,
  qualification_type_id,
  minimum_currency,
  requires_expiry,
  notes,
  is_active
)
select
  s.id,
  atype.id,
  role.id,
  null,
  'green',
  false,
  'Pier launch support role.',
  true
from public.stations s
join public.asset_types atype on atype.code = 'b-class-lifeboat'
join public.operational_roles role on role.code = 'davit_operator'
where s.slug = 'southend-lifeboat-station'
on conflict do nothing;

insert into public.asset_role_qualifications (
  station_id,
  asset_type_id,
  operational_role_id,
  qualification_type_id,
  minimum_currency,
  requires_expiry,
  notes,
  is_active
)
select
  s.id,
  atype.id,
  role.id,
  qtype.id,
  'green',
  true,
  'Casualty care qualification tracked per operational asset.',
  true
from public.stations s
join public.asset_types atype on atype.code in ('d-class-lifeboat', 'b-class-lifeboat', 'hovercraft')
join public.operational_roles role on role.code = 'casualty_care'
join public.qualification_types qtype on qtype.code = 'casualty_care'
where s.slug = 'southend-lifeboat-station'
on conflict do nothing;

insert into public.asset_minimum_crewing (
  station_id,
  asset_type_id,
  minimum_crew_count,
  minimum_boat_crew_count,
  minimum_shore_crew_count,
  minimum_casualty_care_count,
  requires_dla_presence,
  notes,
  is_active
)
select
  s.id,
  atype.id,
  3,
  2,
  0,
  1,
  false,
  'Inshore lifeboat minimum crewing baseline.',
  true
from public.stations s
join public.asset_types atype on atype.code = 'd-class-lifeboat'
where s.slug = 'southend-lifeboat-station'
on conflict do nothing;

insert into public.asset_minimum_crewing (
  station_id,
  asset_type_id,
  minimum_crew_count,
  minimum_boat_crew_count,
  minimum_shore_crew_count,
  minimum_casualty_care_count,
  requires_dla_presence,
  notes,
  is_active
)
select
  s.id,
  atype.id,
  4,
  3,
  0,
  1,
  false,
  'Offshore lifeboat minimum crewing baseline.',
  true
from public.stations s
join public.asset_types atype on atype.code = 'b-class-lifeboat'
where s.slug = 'southend-lifeboat-station'
on conflict do nothing;

insert into public.asset_minimum_crewing (
  station_id,
  asset_type_id,
  minimum_crew_count,
  minimum_boat_crew_count,
  minimum_shore_crew_count,
  minimum_casualty_care_count,
  requires_dla_presence,
  notes,
  is_active
)
select
  s.id,
  atype.id,
  3,
  2,
  0,
  1,
  false,
  'Hovercraft baseline with recovery support dependency.',
  true
from public.stations s
join public.asset_types atype on atype.code = 'hovercraft'
where s.slug = 'southend-lifeboat-station'
on conflict do nothing;

insert into public.asset_minimum_crewing (
  station_id,
  asset_type_id,
  minimum_crew_count,
  minimum_boat_crew_count,
  minimum_shore_crew_count,
  minimum_casualty_care_count,
  requires_dla_presence,
  notes,
  is_active
)
select
  s.id,
  atype.id,
  1,
  0,
  1,
  0,
  true,
  'Launch / recovery equipment needs shore cover and launch authority.',
  true
from public.stations s
join public.asset_types atype on atype.code in ('tractor', 'winch', 'davit')
where s.slug = 'southend-lifeboat-station'
on conflict do nothing;

insert into public.safe_crewing_rules (
  asset_type_id,
  operation_type,
  minimum_crew,
  maximum_crew,
  darkness_minimum_crew,
  effective_from,
  effective_to,
  source_reference,
  notes
)
select
  atype.id,
  rule.operation_type,
  rule.minimum_crew,
  rule.maximum_crew,
  rule.darkness_minimum_crew,
  rule.effective_from,
  rule.effective_to,
  rule.source_reference,
  rule.notes
from public.stations s
cross join (
  values
    ('b-class-lifeboat'::text, 'service'::public.safe_crewing_operation_type, 3, 4, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'B Class baseline for service operations.'),
    ('b-class-lifeboat'::text, 'exercise'::public.safe_crewing_operation_type, 3, 4, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'B Class baseline for exercise operations.'),
    ('b-class-lifeboat'::text, 'passage'::public.safe_crewing_operation_type, 2, 4, 3, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'B Class baseline for passage operations.'),
    ('d-class-lifeboat'::text, 'service'::public.safe_crewing_operation_type, 3, 4, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'D Class baseline for service operations.'),
    ('d-class-lifeboat'::text, 'exercise'::public.safe_crewing_operation_type, 3, 4, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'D Class baseline for exercise operations.'),
    ('d-class-lifeboat'::text, 'passage'::public.safe_crewing_operation_type, 3, 4, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'D Class baseline for passage operations.'),
    ('hovercraft'::text, 'service'::public.safe_crewing_operation_type, 3, 4, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'Hovercraft baseline for service operations.'),
    ('hovercraft'::text, 'exercise'::public.safe_crewing_operation_type, 3, 4, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'Hovercraft baseline for exercise operations.'),
    ('hovercraft'::text, 'passage'::public.safe_crewing_operation_type, 3, 4, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'Hovercraft baseline for passage operations.'),
    ('tractor'::text, 'service'::public.safe_crewing_operation_type, 1, 1, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'Tractor baseline for launch support.'),
    ('tractor'::text, 'exercise'::public.safe_crewing_operation_type, 1, 1, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'Tractor baseline for exercise support.'),
    ('tractor'::text, 'passage'::public.safe_crewing_operation_type, 1, 1, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'Tractor baseline for passage support.'),
    ('winch'::text, 'service'::public.safe_crewing_operation_type, 1, 1, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'Winch baseline for recovery support.'),
    ('winch'::text, 'exercise'::public.safe_crewing_operation_type, 1, 1, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'Winch baseline for exercise support.'),
    ('winch'::text, 'passage'::public.safe_crewing_operation_type, 1, 1, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'Winch baseline for passage support.'),
    ('davit'::text, 'service'::public.safe_crewing_operation_type, 1, 1, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'Davit baseline for recovery support.'),
    ('davit'::text, 'exercise'::public.safe_crewing_operation_type, 1, 1, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'Davit baseline for exercise support.'),
    ('davit'::text, 'passage'::public.safe_crewing_operation_type, 1, 1, null::integer, '2026-03-20'::date, null::date, 'GU1007 internal reference', 'Davit baseline for passage support.')
) as rule(asset_code, operation_type, minimum_crew, maximum_crew, darkness_minimum_crew, effective_from, effective_to, source_reference, notes)
join public.asset_types atype on atype.code = rule.asset_code
where s.slug = 'southend-lifeboat-station'
on conflict (asset_type_id, operation_type, effective_from) do update
set
  minimum_crew = excluded.minimum_crew,
  maximum_crew = excluded.maximum_crew,
  darkness_minimum_crew = excluded.darkness_minimum_crew,
  effective_to = excluded.effective_to,
  source_reference = excluded.source_reference,
  notes = excluded.notes,
  updated_at = now();

insert into public.safe_crewing_role_requirements (
  asset_type_id,
  operation_type,
  operational_role_id,
  required_count,
  requirement_level,
  effective_from,
  effective_to,
  notes
)
select
  atype.id,
  role_rule.operation_type,
  role.id,
  role_rule.required_count,
  role_rule.requirement_level,
  role_rule.effective_from,
  role_rule.effective_to,
  role_rule.notes
from public.stations s
cross join (
  values
    ('b-class-lifeboat'::text, 'service'::public.safe_crewing_operation_type, 'helm'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, '2026-03-20'::date, null::date, 'B Class helm requirement.'),
    ('b-class-lifeboat'::text, 'service'::public.safe_crewing_operation_type, 'tier_2'::text, 1, 'required'::public.safe_crewing_requirement_level, '2026-03-20'::date, '2026-12-31'::date, 'B Class Tier 2 requirement until Navigator requirement takes effect.'),
    ('b-class-lifeboat'::text, 'service'::public.safe_crewing_operation_type, 'navigator'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, '2027-01-01'::date, null::date, 'B Class Navigator requirement from 1 January 2027.'),
    ('b-class-lifeboat'::text, 'service'::public.safe_crewing_operation_type, 'boat_crew'::text, 1, 'required'::public.safe_crewing_requirement_level, '2026-03-20'::date, null::date, 'B Class boat crew support requirement.'),
    ('d-class-lifeboat'::text, 'service'::public.safe_crewing_operation_type, 'helm'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, '2026-03-20'::date, null::date, 'D Class helm requirement.'),
    ('d-class-lifeboat'::text, 'service'::public.safe_crewing_operation_type, 'tier_2'::text, 1, 'required'::public.safe_crewing_requirement_level, '2026-03-20'::date, null::date, 'D Class Tier 2 requirement.'),
    ('d-class-lifeboat'::text, 'service'::public.safe_crewing_operation_type, 'boat_crew'::text, 1, 'required'::public.safe_crewing_requirement_level, '2026-03-20'::date, null::date, 'D Class boat crew requirement.'),
    ('hovercraft'::text, 'service'::public.safe_crewing_operation_type, 'commander'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, '2026-03-20'::date, null::date, 'Hovercraft commander requirement.'),
    ('hovercraft'::text, 'service'::public.safe_crewing_operation_type, 'pilot'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, '2026-03-20'::date, null::date, 'Hovercraft pilot requirement.'),
    ('hovercraft'::text, 'service'::public.safe_crewing_operation_type, 'boat_crew'::text, 1, 'required'::public.safe_crewing_requirement_level, '2026-03-20'::date, null::date, 'Hovercraft crew requirement.'),
    ('tractor'::text, 'service'::public.safe_crewing_operation_type, 'tractor_driver'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, '2026-03-20'::date, null::date, 'Tractor driver requirement.'),
    ('winch'::text, 'service'::public.safe_crewing_operation_type, 'winch_operator'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, '2026-03-20'::date, null::date, 'Winch operator requirement.'),
    ('davit'::text, 'service'::public.safe_crewing_operation_type, 'davit_operator'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, '2026-03-20'::date, null::date, 'Davit operator requirement.')
) as role_rule(asset_code, operation_type, role_code, required_count, requirement_level, effective_from, effective_to, notes)
join public.asset_types atype on atype.code = role_rule.asset_code
join public.operational_roles role on role.code = role_rule.role_code
where s.slug = 'southend-lifeboat-station'
on conflict (asset_type_id, operation_type, operational_role_id, effective_from) do update
set
  required_count = excluded.required_count,
  requirement_level = excluded.requirement_level,
  effective_to = excluded.effective_to,
  notes = excluded.notes,
  updated_at = now();

insert into public.asset_launch_recovery_requirements (
  asset_id,
  operational_role_id,
  required_count,
  requirement_level,
  notes
)
with asset_rule(location_name, asset_name, role_code, required_count, requirement_level, notes) as (
  values
    ('Inshore Station'::text, 'D Class'::text, 'tractor_driver'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, 'D Class inshore launch support requirement.'),
    ('Offshore / Pier Station'::text, 'D Class'::text, 'davit_operator'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, 'D Class pier launch support requirement.'),
    ('Offshore / Pier Station'::text, 'B Class'::text, 'davit_operator'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, 'B Class pier launch support requirement.'),
    ('Inshore Station'::text, 'Hovercraft'::text, 'winch_operator'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, 'Hovercraft recovery support requirement.'),
    ('Inshore Station'::text, 'Tractor'::text, 'tractor_driver'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, 'Tractor support requirement.'),
    ('Inshore Station'::text, 'Winch'::text, 'winch_operator'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, 'Winch support requirement.'),
    ('Offshore / Pier Station'::text, 'Davit'::text, 'davit_operator'::text, 1, 'hard_stop'::public.safe_crewing_requirement_level, 'Davit support requirement.')
) select
  asset_record.id,
  role.id,
  asset_rule.required_count,
  asset_rule.requirement_level,
  asset_rule.notes
from asset_rule
join public.stations s on s.slug = 'southend-lifeboat-station'
join public.station_locations sl
  on sl.station_id = s.id
  and sl.name = asset_rule.location_name
join public.assets asset_record
  on asset_record.station_location_id = sl.id
  and asset_record.name = asset_rule.asset_name
join public.operational_roles role
  on role.code = asset_rule.role_code
on conflict (asset_id, operational_role_id, requirement_level) do update
set
  required_count = excluded.required_count,
  notes = excluded.notes,
  updated_at = now();

insert into public.system_settings (
  organisation_id,
  station_id,
  setting_key,
  setting_value,
  updated_by_profile_id
)
select
  o.id,
  null,
  'demo_mode_enabled',
  '{"enabled": true}'::jsonb,
  null
from public.organisations o
where o.slug = 'launch-ready-demo'
on conflict (organisation_id, station_id, setting_key) do update
set setting_value = excluded.setting_value;

insert into public.system_settings (
  organisation_id,
  station_id,
  setting_key,
  setting_value,
  updated_by_profile_id
)
select
  o.id,
  null,
  'default_alert_channels',
  '{"primary": "in_app", "secondary": ["email", "sms", "whatsapp", "push"]}'::jsonb,
  null
from public.organisations o
where o.slug = 'launch-ready-demo'
on conflict (organisation_id, station_id, setting_key) do update
set setting_value = excluded.setting_value;
