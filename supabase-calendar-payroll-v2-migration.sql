-- MyWorkday: iconos, turnos sin horas, tramos nocturnos y festivos locales.
-- Ejecutar en Supabase SQL Editor.

alter table public.shifts
  add column if not exists icon text default 'briefcase',
  add column if not exists is_time_off boolean not null default false;

alter table public.shift_types
  add column if not exists icon text default 'briefcase',
  add column if not exists is_time_off boolean not null default false;

create table if not exists public.night_pay_ranges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_time time not null,
  end_time time not null,
  hour_rate numeric(10, 4) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.night_pay_ranges enable row level security;

do $$
begin
  create policy "Users can read their night ranges"
    on public.night_pay_ranges for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can insert their night ranges"
    on public.night_pay_ranges for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can update their night ranges"
    on public.night_pay_ranges for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can delete their night ranges"
    on public.night_pay_ranges for delete
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  holiday_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, holiday_date)
);

alter table public.holidays
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists holiday_date date,
  add column if not exists created_at timestamptz not null default now();

alter table public.holidays enable row level security;

do $$
begin
  create policy "Users can read their holidays"
    on public.holidays for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can insert their holidays"
    on public.holidays for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can delete their holidays"
    on public.holidays for delete
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
