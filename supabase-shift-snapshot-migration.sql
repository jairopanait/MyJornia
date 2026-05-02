alter table public.shifts
add column if not exists title text not null default 'Turno',
add column if not exists color text not null default '#2563EB';

update public.shifts
set title = 'Turno'
where title is null;

update public.shifts
set color = '#2563EB'
where color is null;
