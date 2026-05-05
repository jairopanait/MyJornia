-- MyJornia: endurecimiento de seguridad para Supabase.
-- Ejecutar en Supabase SQL Editor despues de las migraciones de calendario/nomina.
-- No pegues nunca claves secretas en la app movil: solo la Publishable key.

alter table if exists public.profiles enable row level security;
alter table if exists public.shifts enable row level security;
alter table if exists public.shift_types enable row level security;
alter table if exists public.work_rules enable row level security;
alter table if exists public.holidays enable row level security;
alter table if exists public.night_pay_ranges enable row level security;
alter table if exists public.payroll_deductions enable row level security;
alter table if exists public.payroll_additions enable row level security;
alter table if exists public.payroll_addition_shift_types enable row level security;
alter table if exists public.app_admins enable row level security;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_admin(user_uuid uuid default auth.uid())
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

revoke all on function private.is_admin(uuid) from public;
grant execute on function private.is_admin(uuid) to authenticated;

create or replace function public.is_admin(user_uuid uuid default auth.uid())
returns boolean
language sql
stable
security invoker
set search_path = public, private
as $$
  select private.is_admin((select auth.uid()));
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- Perfil: cada usuario ve y actualiza solo su ficha. Admin puede leer todas.
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

-- Admins: el usuario solo puede saber si el mismo es admin. Solo SQL/service role asigna admins.
drop policy if exists "Users can view own admin status" on public.app_admins;
create policy "Users can view own admin status"
on public.app_admins
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Admins can view all admin users" on public.app_admins;
create policy "Admins can view all admin users"
on public.app_admins
for select
to authenticated
using (public.is_admin());

-- Turnos del calendario.
drop policy if exists "Users can view own shifts" on public.shifts;
create policy "Users can view own shifts"
on public.shifts
for select
to authenticated
using (((select auth.uid()) is not null and (select auth.uid()) = user_id) or public.is_admin());

drop policy if exists "Users can insert own shifts" on public.shifts;
create policy "Users can insert own shifts"
on public.shifts
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can update own shifts" on public.shifts;
create policy "Users can update own shifts"
on public.shifts
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete own shifts" on public.shifts;
create policy "Users can delete own shifts"
on public.shifts
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Plantillas de turnos.
drop policy if exists "Users can view own shift types" on public.shift_types;
create policy "Users can view own shift types"
on public.shift_types
for select
to authenticated
using (((select auth.uid()) is not null and (select auth.uid()) = user_id) or public.is_admin());

drop policy if exists "Users can insert own shift types" on public.shift_types;
create policy "Users can insert own shift types"
on public.shift_types
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can update own shift types" on public.shift_types;
create policy "Users can update own shift types"
on public.shift_types
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete own shift types" on public.shift_types;
create policy "Users can delete own shift types"
on public.shift_types
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Reglas salariales/contrato.
drop policy if exists "Users can view own work rules" on public.work_rules;
create policy "Users can view own work rules"
on public.work_rules
for select
to authenticated
using (((select auth.uid()) is not null and (select auth.uid()) = user_id) or public.is_admin());

drop policy if exists "Users can insert own work rules" on public.work_rules;
create policy "Users can insert own work rules"
on public.work_rules
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can update own work rules" on public.work_rules;
create policy "Users can update own work rules"
on public.work_rules
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Festivos locales personales.
drop policy if exists "Users can view own holidays" on public.holidays;
create policy "Users can view own holidays"
on public.holidays
for select
to authenticated
using (((select auth.uid()) is not null and (select auth.uid()) = user_id) or public.is_admin());

drop policy if exists "Users can insert own holidays" on public.holidays;
create policy "Users can insert own holidays"
on public.holidays
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete own holidays" on public.holidays;
create policy "Users can delete own holidays"
on public.holidays
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Tramos nocturnos.
drop policy if exists "Users can view own night ranges" on public.night_pay_ranges;
create policy "Users can view own night ranges"
on public.night_pay_ranges
for select
to authenticated
using (((select auth.uid()) is not null and (select auth.uid()) = user_id) or public.is_admin());

drop policy if exists "Users can insert own night ranges" on public.night_pay_ranges;
create policy "Users can insert own night ranges"
on public.night_pay_ranges
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can update own night ranges" on public.night_pay_ranges;
create policy "Users can update own night ranges"
on public.night_pay_ranges
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete own night ranges" on public.night_pay_ranges;
create policy "Users can delete own night ranges"
on public.night_pay_ranges
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Deducciones.
drop policy if exists "Users can view own payroll deductions" on public.payroll_deductions;
create policy "Users can view own payroll deductions"
on public.payroll_deductions
for select
to authenticated
using (((select auth.uid()) is not null and (select auth.uid()) = user_id) or public.is_admin());

drop policy if exists "Users can insert own payroll deductions" on public.payroll_deductions;
create policy "Users can insert own payroll deductions"
on public.payroll_deductions
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can update own payroll deductions" on public.payroll_deductions;
create policy "Users can update own payroll deductions"
on public.payroll_deductions
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete own payroll deductions" on public.payroll_deductions;
create policy "Users can delete own payroll deductions"
on public.payroll_deductions
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Pagas/conceptos extra.
drop policy if exists "Users can view own payroll additions" on public.payroll_additions;
create policy "Users can view own payroll additions"
on public.payroll_additions
for select
to authenticated
using (((select auth.uid()) is not null and (select auth.uid()) = user_id) or public.is_admin());

drop policy if exists "Users can insert own payroll additions" on public.payroll_additions;
create policy "Users can insert own payroll additions"
on public.payroll_additions
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can update own payroll additions" on public.payroll_additions;
create policy "Users can update own payroll additions"
on public.payroll_additions
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete own payroll additions" on public.payroll_additions;
create policy "Users can delete own payroll additions"
on public.payroll_additions
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

-- Relacion entre pagas extra y plantillas.
drop policy if exists "Users can view own payroll addition shift types" on public.payroll_addition_shift_types;
create policy "Users can view own payroll addition shift types"
on public.payroll_addition_shift_types
for select
to authenticated
using (((select auth.uid()) is not null and (select auth.uid()) = user_id) or public.is_admin());

drop policy if exists "Users can insert own payroll addition shift types" on public.payroll_addition_shift_types;
create policy "Users can insert own payroll addition shift types"
on public.payroll_addition_shift_types
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete own payroll addition shift types" on public.payroll_addition_shift_types;
create policy "Users can delete own payroll addition shift types"
on public.payroll_addition_shift_types
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
