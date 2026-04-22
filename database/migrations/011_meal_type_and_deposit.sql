-- Add meal_type to reservations and deposit_amount to restaurants for per-person deposits.

alter table public.reservations
  add column if not exists meal_type text;

-- Optional constraint (only if column exists)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reservations'
      and column_name = 'meal_type'
  ) then
    begin
      alter table public.reservations
        add constraint reservations_meal_type_check
        check (meal_type in ('comida', 'cena'));
    exception when duplicate_object then
      -- ignore
    end;
  end if;
end $$;

-- Restaurants already has deposit_amount in schema.sql; ensure it's present for older DBs.
alter table public.restaurants
  add column if not exists deposit_amount integer not null default 0;

