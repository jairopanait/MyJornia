create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin(user_uuid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where app_admins.user_id = user_uuid
  );
$$;

alter table public.work_rules
add column if not exists contract_hours numeric not null default 160,
add column if not exists base_salary numeric not null default 0,
add column if not exists complementary_hour_rate numeric not null default 0,
add column if not exists night_hour_rate numeric not null default 0,
add column if not exists holiday_hour_rate numeric not null default 0,
add column if not exists holiday_shift_rate numeric not null default 0,
add column if not exists holiday_pay_mode text not null default 'hour',
add column if not exists autonomous_community text;

create table if not exists public.payroll_deductions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  percentage numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.payroll_deductions enable row level security;

drop policy if exists "Users can view own payroll deductions" on public.payroll_deductions;
create policy "Users can view own payroll deductions"
on public.payroll_deductions
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own payroll deductions" on public.payroll_deductions;
create policy "Users can insert own payroll deductions"
on public.payroll_deductions
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own payroll deductions" on public.payroll_deductions;
create policy "Users can update own payroll deductions"
on public.payroll_deductions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own payroll deductions" on public.payroll_deductions;
create policy "Users can delete own payroll deductions"
on public.payroll_deductions
for delete
using (auth.uid() = user_id);

drop policy if exists "Admins can view all payroll deductions" on public.payroll_deductions;
create policy "Admins can view all payroll deductions"
on public.payroll_deductions
for select
using (public.is_admin());
