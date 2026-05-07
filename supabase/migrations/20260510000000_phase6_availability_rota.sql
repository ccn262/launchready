do $$
begin
  alter type public.availability_slot_kind add value if not exists 'weekend_unavailable';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type public.duty_period_kind add value if not exists 'weekend_cover';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type public.duty_period_kind add value if not exists 'dla_day';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type public.duty_period_kind add value if not exists 'dla_night';
exception
  when duplicate_object then null;
end $$;

alter table public.availability_slots
add column if not exists starts_at timestamptz,
add column if not exists ends_at timestamptz,
add column if not exists created_by_profile_id uuid references public.profiles (id) on delete set null;

alter table public.duty_periods
add column if not exists starts_at timestamptz,
add column if not exists ends_at timestamptz,
add column if not exists created_by_profile_id uuid references public.profiles (id) on delete set null;

create index if not exists availability_slots_starts_at_idx on public.availability_slots (starts_at);
create index if not exists availability_slots_ends_at_idx on public.availability_slots (ends_at);
create index if not exists duty_periods_starts_at_idx on public.duty_periods (starts_at);
create index if not exists duty_periods_ends_at_idx on public.duty_periods (ends_at);
