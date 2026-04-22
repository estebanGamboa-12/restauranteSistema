-- Migration: extend schema with customers, reservations, reservation_tables,
-- table_sessions, restaurant_settings, restaurant_staff.
-- Multi-tenant: all tables include restaurant_id → restaurants(id).
-- Run in Supabase SQL Editor. Does not drop or modify existing data.
--
-- NOTE: If you already have a "reservations" table (e.g. from an older schema),
-- this script will NOT replace it (create if not exists). In that case either
-- use a new DB, or rename the old table first and then run this migration.

-- ============================
-- CUSTOMERS
-- ============================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists customers_restaurant_id_idx on public.customers(restaurant_id);
create index if not exists customers_email_idx on public.customers(email);

-- ============================
-- RESERVATIONS (new structure; skip if you already have one)
-- ============================
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  guests integer not null check (guests > 0),
  reservation_date date not null,
  reservation_time time not null,
  status text not null default 'reservada'
    check (status in ('reservada','confirmada','cancelada','no_show','completada')),
  created_at timestamptz not null default now()
);

create index if not exists reservations_restaurant_id_idx on public.reservations(restaurant_id);
create index if not exists reservations_reservation_date_idx on public.reservations(reservation_date);
-- Solo crear índice en customer_id si la columna existe (schema.sql no la incluye)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reservations' and column_name = 'customer_id'
  ) then
    create index if not exists reservations_customer_id_idx on public.reservations(customer_id);
  end if;
end $$;

-- ============================
-- RESERVATION_TABLES (junction: reservation ↔ tables)
-- ============================
create table if not exists public.reservation_tables (
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  table_id uuid not null references public.tables(id) on delete cascade,
  primary key (reservation_id, table_id)
);

create index if not exists reservation_tables_table_id_idx on public.reservation_tables(table_id);

-- ============================
-- TABLE_SESSIONS
-- ============================
create table if not exists public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid not null references public.tables(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists table_sessions_restaurant_id_idx on public.table_sessions(restaurant_id);
create index if not exists table_sessions_table_id_idx on public.table_sessions(table_id);
create index if not exists table_sessions_reservation_id_idx on public.table_sessions(reservation_id);

-- ============================
-- RESTAURANT_SETTINGS (one row per restaurant)
-- ============================
create table if not exists public.restaurant_settings (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  opening_time time,
  closing_time time,
  deposit_per_person integer,
  email_reminders_enabled boolean not null default true
);

-- ============================
-- RESTAURANT_STAFF
-- ============================
create table if not exists public.restaurant_staff (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  role text not null default 'staff'
    check (role in ('admin','manager','staff')),
  created_at timestamptz not null default now()
);

create unique index if not exists restaurant_staff_restaurant_user_uniq
  on public.restaurant_staff(restaurant_id, user_id);
create index if not exists restaurant_staff_restaurant_id_idx on public.restaurant_staff(restaurant_id);
create index if not exists restaurant_staff_user_id_idx on public.restaurant_staff(user_id);
