-- Añadir columnas de horario y preferencias de reserva a restaurants.
-- Ejecuta esto en Supabase SQL Editor si tu tabla no las tiene.

alter table public.restaurants
  add column if not exists opening_time text,
  add column if not exists closing_time text,
  add column if not exists default_reservation_duration integer,
  add column if not exists max_guests_per_reservation integer;
