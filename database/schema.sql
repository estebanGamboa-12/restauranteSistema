-- Esquema completo para la BBDD de reservas SaaS (PostgreSQL / Supabase)
-- Puedes ejecutar este archivo en Supabase SQL Editor o en tu Postgres local.

-- ============================
-- RESTAURANTS (tenants)
-- ============================
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),  -- id aleatorio
  name text not null,
  slug text not null unique,
  email text,
  phone text,
  address text,
  city text,
  country text,
  stripe_account_id text,
  deposit_amount integer not null default 1000, -- depósito por reserva (ej. 10€)
  created_at timestamptz not null default now()
);

-- ============================
-- TABLES (mesas físicas)
-- ============================
create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),  -- id aleatorio
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,        -- ej: "Mesa 1"
  capacity integer not null check (capacity > 0),
  created_at timestamptz not null default now()
);

create unique index if not exists tables_restaurant_name_uniq
  on public.tables (restaurant_id, name);

create index if not exists tables_restaurant_id_idx
  on public.tables (restaurant_id);

-- ============================
-- RESERVATIONS
-- ============================
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),  -- id aleatorio
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid not null references public.tables(id),
  customer_name text not null,   -- nombre del cliente
  customer_email text,
  customer_phone text,
  guests integer not null check (guests > 0),
  reservation_date date not null,
  reservation_time time not null,
  deposit_paid boolean not null default false,
  deposit_amount integer not null default 0,
  stripe_payment_intent text,
  stripe_checkout_session_id text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamptz not null default now()
);

create index if not exists reservations_restaurant_id_idx
  on public.reservations (restaurant_id);

create index if not exists reservations_date_idx
  on public.reservations (reservation_date);

create index if not exists reservations_time_idx
  on public.reservations (reservation_time);

create index if not exists reservations_restaurant_date_time_idx
  on public.reservations (restaurant_id, reservation_date, reservation_time);

-- ============================
-- RESTAURANT_USERS
-- ============================
create table if not exists public.restaurant_users (
  id uuid primary key default gen_random_uuid(),  -- id aleatorio
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner','staff')),
  created_at timestamptz not null default now()
);

create unique index if not exists restaurant_users_restaurant_email_uniq
  on public.restaurant_users (restaurant_id, email);

create index if not exists restaurant_users_restaurant_id_idx
  on public.restaurant_users (restaurant_id);

-- ============================
-- RPC para buscar mesa disponible
-- ============================
create or replace function public.find_available_table(
  p_restaurant_id uuid,
  p_guests integer,
  p_reservation_date date,
  p_reservation_time time
)
returns table (id uuid, capacity integer) as $$
begin
  return query
  select t.id, t.capacity
  from public.tables t
  where
    t.restaurant_id = p_restaurant_id
    and t.capacity >= p_guests
    and not exists (
      select 1
      from public.reservations r
      where
        r.restaurant_id = t.restaurant_id
        and r.table_id = t.id
        and r.reservation_date = p_reservation_date
        and r.reservation_time = p_reservation_time
        and r.status in ('pending','confirmed')
    )
  order by t.capacity asc
  limit 1;
end;
$$ language plpgsql security definer;

