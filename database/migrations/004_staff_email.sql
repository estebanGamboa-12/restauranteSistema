-- Add email to restaurant_staff for display (synced from auth on create/update).
alter table public.restaurant_staff
  add column if not exists email text;
