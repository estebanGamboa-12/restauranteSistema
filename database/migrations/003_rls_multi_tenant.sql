-- RLS policies for multi-tenant architecture.
-- Run after 002_customers_reservations_settings_staff.sql (or once all tables exist).
-- Employees can only access rows where restaurant_id matches their staff assignment.
--
-- First staff per restaurant: insert into restaurant_staff via service role or
-- SQL Editor (bypasses RLS), then staff can manage their own restaurant data.

-- ============================
-- 1. Enable RLS on all tables
-- ============================
alter table public.tables enable row level security;
alter table public.customers enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_tables enable row level security;
alter table public.table_sessions enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.restaurant_staff enable row level security;

-- ============================
-- 2. Helper: current user's restaurant_id
-- ============================
create or replace function public.current_user_restaurant_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select restaurant_id
  from public.restaurant_staff
  where user_id = auth.uid()
  limit 1;
$$;

comment on function public.current_user_restaurant_id() is
  'Returns the restaurant_id for the authenticated user (from restaurant_staff). Used by RLS policies.';

-- ============================
-- 3. Policies: tables (mesas)
-- ============================
create policy "tables_select_own_restaurant"
  on public.tables for select
  using (restaurant_id = public.current_user_restaurant_id());

create policy "tables_insert_own_restaurant"
  on public.tables for insert
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "tables_update_own_restaurant"
  on public.tables for update
  using (restaurant_id = public.current_user_restaurant_id())
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "tables_delete_own_restaurant"
  on public.tables for delete
  using (restaurant_id = public.current_user_restaurant_id());

-- ============================
-- 4. Policies: customers
-- ============================
create policy "customers_select_own_restaurant"
  on public.customers for select
  using (restaurant_id = public.current_user_restaurant_id());

create policy "customers_insert_own_restaurant"
  on public.customers for insert
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "customers_update_own_restaurant"
  on public.customers for update
  using (restaurant_id = public.current_user_restaurant_id())
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "customers_delete_own_restaurant"
  on public.customers for delete
  using (restaurant_id = public.current_user_restaurant_id());

-- ============================
-- 5. Policies: reservations
-- ============================
create policy "reservations_select_own_restaurant"
  on public.reservations for select
  using (restaurant_id = public.current_user_restaurant_id());

create policy "reservations_insert_own_restaurant"
  on public.reservations for insert
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "reservations_update_own_restaurant"
  on public.reservations for update
  using (restaurant_id = public.current_user_restaurant_id())
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "reservations_delete_own_restaurant"
  on public.reservations for delete
  using (restaurant_id = public.current_user_restaurant_id());

-- ============================
-- 6. Policies: reservation_tables (via reservation's restaurant)
-- ============================
create policy "reservation_tables_select_own_restaurant"
  on public.reservation_tables for select
  using (
    exists (
      select 1 from public.reservations r
      where r.id = reservation_tables.reservation_id
        and r.restaurant_id = public.current_user_restaurant_id()
    )
  );

create policy "reservation_tables_insert_own_restaurant"
  on public.reservation_tables for insert
  with check (
    exists (
      select 1 from public.reservations r
      where r.id = reservation_id
        and r.restaurant_id = public.current_user_restaurant_id()
    )
  );

create policy "reservation_tables_update_own_restaurant"
  on public.reservation_tables for update
  using (
    exists (
      select 1 from public.reservations r
      where r.id = reservation_tables.reservation_id
        and r.restaurant_id = public.current_user_restaurant_id()
    )
  )
  with check (
    exists (
      select 1 from public.reservations r
      where r.id = reservation_id
        and r.restaurant_id = public.current_user_restaurant_id()
    )
  );

create policy "reservation_tables_delete_own_restaurant"
  on public.reservation_tables for delete
  using (
    exists (
      select 1 from public.reservations r
      where r.id = reservation_tables.reservation_id
        and r.restaurant_id = public.current_user_restaurant_id()
    )
  );

-- ============================
-- 7. Policies: table_sessions
-- ============================
create policy "table_sessions_select_own_restaurant"
  on public.table_sessions for select
  using (restaurant_id = public.current_user_restaurant_id());

create policy "table_sessions_insert_own_restaurant"
  on public.table_sessions for insert
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "table_sessions_update_own_restaurant"
  on public.table_sessions for update
  using (restaurant_id = public.current_user_restaurant_id())
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "table_sessions_delete_own_restaurant"
  on public.table_sessions for delete
  using (restaurant_id = public.current_user_restaurant_id());

-- ============================
-- 8. Policies: restaurant_settings
-- ============================
create policy "restaurant_settings_select_own_restaurant"
  on public.restaurant_settings for select
  using (restaurant_id = public.current_user_restaurant_id());

create policy "restaurant_settings_insert_own_restaurant"
  on public.restaurant_settings for insert
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "restaurant_settings_update_own_restaurant"
  on public.restaurant_settings for update
  using (restaurant_id = public.current_user_restaurant_id())
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "restaurant_settings_delete_own_restaurant"
  on public.restaurant_settings for delete
  using (restaurant_id = public.current_user_restaurant_id());

-- ============================
-- 9. Policies: restaurant_staff
-- ============================
create policy "restaurant_staff_select_own_restaurant"
  on public.restaurant_staff for select
  using (restaurant_id = public.current_user_restaurant_id());

create policy "restaurant_staff_insert_own_restaurant"
  on public.restaurant_staff for insert
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "restaurant_staff_update_own_restaurant"
  on public.restaurant_staff for update
  using (restaurant_id = public.current_user_restaurant_id())
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "restaurant_staff_delete_own_restaurant"
  on public.restaurant_staff for delete
  using (restaurant_id = public.current_user_restaurant_id());
