-- Horarios de reserva: Comida / Cena, zona horaria y intervalo de slots.
-- Ejecutar en Supabase SQL Editor.

alter table public.restaurants
  add column if not exists timezone text default 'Europe/Madrid',
  add column if not exists comida_start time,
  add column if not exists comida_end time,
  add column if not exists cena_start time,
  add column if not exists cena_end time,
  add column if not exists slot_interval_minutes integer default 15;

comment on column public.restaurants.timezone is 'Zona horaria del restaurante (ej. Europe/Madrid)';
comment on column public.restaurants.comida_start is 'Inicio franja comida (ej. 13:00)';
comment on column public.restaurants.comida_end is 'Fin franja comida (ej. 16:00)';
comment on column public.restaurants.cena_start is 'Inicio franja cena (ej. 20:00)';
comment on column public.restaurants.cena_end is 'Fin franja cena (ej. 23:00)';
comment on column public.restaurants.slot_interval_minutes is 'Intervalo entre slots de reserva en minutos (ej. 15)';
