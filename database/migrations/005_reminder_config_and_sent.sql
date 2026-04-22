-- Email reminders: config per restaurant + track sent per reservation.

-- restaurant_settings: hours before reservation to send reminder (e.g. 24)
alter table public.restaurant_settings
  add column if not exists reminder_hours_before integer default 24;

-- reservations: mark when reminder was sent (null = not sent yet)
alter table public.reservations
  add column if not exists reminder_sent_at timestamptz;

create index if not exists reservations_reminder_sent_at_idx
  on public.reservations (reminder_sent_at)
  where reminder_sent_at is null;
