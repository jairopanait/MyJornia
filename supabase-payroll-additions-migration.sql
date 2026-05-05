-- MyJornia: conceptos positivos extra de nómina.
-- Ejemplos: limpieza de ropa por turno trabajado, transporte fijo, dietas por hora.
-- Ejecutar en Supabase SQL Editor.

create table if not exists public.payroll_additions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(10, 4) not null default 0,
  mode text not null default 'per_shift' check (mode in ('fixed', 'per_shift', 'per_hour')),
  created_at timestamptz not null default now()
);

alter table public.payroll_additions enable row level security;

do $$
begin
  create policy "Users can read their payroll additions"
    on public.payroll_additions for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can insert their payroll additions"
    on public.payroll_additions for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can update their payroll additions"
    on public.payroll_additions for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Users can delete their payroll additions"
    on public.payroll_additions for delete
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
