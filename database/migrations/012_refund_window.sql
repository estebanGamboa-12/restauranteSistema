-- Configurable refund window per restaurant (in hours).
-- Default: 48h.

alter table public.restaurants
  add column if not exists refund_window_hours integer not null default 48;

