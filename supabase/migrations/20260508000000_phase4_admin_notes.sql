alter table public.station_locations
add column if not exists notes text;

alter table public.assets
add column if not exists notes text;
