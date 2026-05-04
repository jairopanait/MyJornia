-- MyWorkday: elegir en qué turnos se aplica cada paga extra.
-- Ejecutar en Supabase SQL Editor después de supabase-payroll-additions-migration.sql.

create table if not exists public.payroll_addition_shift_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  addition_id uuid not null references public.payroll_additions(id) on delete cascade,
  shift_type_id uuid not null references public.shift_types(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (addition_id, shift_type_id)
);

alter table public.payroll_addition_shift_types enable row level security;

do $$
begin
  create policy "Users can read their payroll addition shift types"
    on public.payroll_addition_shift_types for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can insert their payroll addition shift types"
    on public.payroll_addition_shift_types for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can delete their payroll addition shift types"
    on public.payroll_addition_shift_types for delete
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
