-- Optional: notes field for reservations (used by dashboard).
alter table public.reservations
  add column if not exists notes text;
