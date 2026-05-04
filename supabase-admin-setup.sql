create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

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

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

insert into public.app_admins (user_id)
select id
from auth.users
where email = 'panaitgarcia@gmail.com'
on conflict (user_id) do nothing;

drop policy if exists "Users can view own admin status" on public.app_admins;
create policy "Users can view own admin status"
on public.app_admins
for select
using (auth.uid() = user_id);

drop policy if exists "Admins can view all admin users" on public.app_admins;
create policy "Admins can view all admin users"
on public.app_admins
for select
using (public.is_admin());

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
using (public.is_admin());

drop policy if exists "Admins can view all shift types" on public.shift_types;
create policy "Admins can view all shift types"
on public.shift_types
for select
using (public.is_admin());

drop policy if exists "Admins can view all shifts" on public.shifts;
create policy "Admins can view all shifts"
on public.shifts
for select
using (public.is_admin());

drop policy if exists "Admins can view all work rules" on public.work_rules;
create policy "Admins can view all work rules"
on public.work_rules
for select
using (public.is_admin());

drop policy if exists "Admins can view all holidays" on public.holidays;
create policy "Admins can view all holidays"
on public.holidays
for select
using (public.is_admin());
