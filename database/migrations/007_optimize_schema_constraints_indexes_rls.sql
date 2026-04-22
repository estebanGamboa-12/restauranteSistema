-- 007: Schema optimization — constraints, indexes, RLS helper, RLS on restaurants.
-- Does not delete or modify existing data. Safe to run after 003_rls_multi_tenant.sql.

-- ============================
-- STEP 1 — Unique constraint restaurant_staff (user_id, restaurant_id)
-- ============================
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.restaurant_staff'::regclass
      and conname = 'unique_user_restaurant'
  ) then
    alter table public.restaurant_staff
      add constraint unique_user_restaurant
      unique (user_id, restaurant_id);
  end if;
end $$;

-- ============================
-- STEP 2 — Performance indexes
-- ============================
create index if not exists idx_staff_user
  on public.restaurant_staff(user_id);

create index if not exists idx_reservations_restaurant
  on public.reservations(restaurant_id);

create index if not exists idx_reservations_date
  on public.reservations(reservation_date);

create index if not exists idx_tables_restaurant
  on public.tables(restaurant_id);

create index if not exists idx_customers_restaurant
  on public.customers(restaurant_id);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reservations'
      and column_name = 'customer_id'
  ) then
    create index if not exists idx_reservation_customer
      on public.reservations(customer_id);
  end if;
end $$;

-- ============================
-- STEP 3 — Helper for RLS (alias / alternative name)
-- ============================
create or replace function public.get_current_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select restaurant_id
  from public.restaurant_staff
  where user_id = auth.uid()
  limit 1;
$$;

comment on function public.get_current_restaurant_id() is
  'Returns restaurant_id for the current user (from restaurant_staff). For RLS.';

-- ============================
-- STEP 4 — Enable RLS on restaurants (not enabled in 003)
-- ============================
alter table public.restaurants enable row level security;

-- ============================
-- STEP 5 — RLS policies for restaurants (id = current restaurant)
-- ============================
create policy "restaurants_isolation_select"
  on public.restaurants for select
  using (id = public.get_current_restaurant_id());

create policy "restaurants_isolation_update"
  on public.restaurants for update
  using (id = public.get_current_restaurant_id())
  with check (id = public.get_current_restaurant_id());

-- INSERT/DELETE on restaurants: typically only service role creates tenants.
-- No policy = no access for staff; service role bypasses RLS.
