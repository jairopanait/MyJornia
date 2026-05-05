-- MyJornia: eliminacion real de cuenta desde la app.
-- Ejecutar en Supabase SQL Editor.
-- La app nunca debe usar service_role; esta funcion borra solo el usuario autenticado.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  delete from public.payroll_addition_shift_types where user_id = current_user_id;
  delete from public.payroll_additions where user_id = current_user_id;
  delete from public.payroll_deductions where user_id = current_user_id;
  delete from public.night_pay_ranges where user_id = current_user_id;
  delete from public.holidays where user_id = current_user_id;
  delete from public.shifts where user_id = current_user_id;
  delete from public.shift_types where user_id = current_user_id;
  delete from public.work_rules where user_id = current_user_id;
  delete from public.app_admins where user_id = current_user_id;
  delete from public.profiles where id = current_user_id;
  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
