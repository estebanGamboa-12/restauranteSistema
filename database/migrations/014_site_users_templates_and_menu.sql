-- 014: Vincular auth.users con customers (cuenta del cliente web),
--       plantillas de mensajes editables, tabla menu_items para la carta
--       y RLS para que el cliente registrado pueda ver/editar solo sus reservas.
-- Segura de ejecutar sobre bases de datos creadas desde schema.sql (antiguas)
-- o desde las migraciones 002/003. Añade columnas/índices solo si faltan.

-- ============================
-- STEP 0 — Asegurar columnas previas necesarias en reservations
-- (el schema.sql original NO incluía customer_id)
-- ============================
alter table public.reservations
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

create index if not exists reservations_customer_id_idx
  on public.reservations(customer_id);

-- ============================
-- STEP 1 — Extender customers
-- ============================
alter table public.customers
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists marketing_channel_email boolean not null default false,
  add column if not exists marketing_channel_whatsapp boolean not null default false,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists privacy_accepted_at timestamptz;

create index if not exists customers_user_id_idx on public.customers(user_id);

-- Un usuario, un customer por restaurante
create unique index if not exists customers_restaurant_user_uniq
  on public.customers(restaurant_id, user_id)
  where user_id is not null;

-- ============================
-- STEP 2 — RLS habilitado (idempotente)
-- ============================
alter table public.customers    enable row level security;
alter table public.reservations enable row level security;

-- ============================
-- STEP 3 — Política RLS: clientes pueden ver sus reservas
-- ============================
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reservations'
      and policyname = 'reservations_select_own_user'
  ) then
    drop policy "reservations_select_own_user" on public.reservations;
  end if;
end $$;

create policy "reservations_select_own_user"
  on public.reservations for select
  using (
    exists (
      select 1 from public.customers c
      where c.id = public.reservations.customer_id
        and c.user_id = auth.uid()
    )
  );

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'customers'
      and policyname = 'customers_select_own_user'
  ) then
    drop policy "customers_select_own_user" on public.customers;
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'customers'
      and policyname = 'customers_update_own_user'
  ) then
    drop policy "customers_update_own_user" on public.customers;
  end if;
end $$;

create policy "customers_select_own_user"
  on public.customers for select
  using (user_id = auth.uid());

create policy "customers_update_own_user"
  on public.customers for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================
-- STEP 4 — message_templates
-- ============================
create table if not exists public.message_templates (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  key text not null,
  title text not null,
  body text not null,
  updated_at timestamptz not null default now(),
  primary key (restaurant_id, key)
);

alter table public.message_templates enable row level security;

do $$
declare
  has_helper boolean;
begin
  -- ¿Existe la función helper de multi-tenant (migración 003)?
  select exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'current_user_restaurant_id'
  ) into has_helper;

  -- Si no existe, no creamos policies restrictivas; la tabla sigue gestionándose
  -- desde la service_role del backend (que ignora RLS).
  if has_helper then
    if exists (select 1 from pg_policies where schemaname='public' and tablename='message_templates' and policyname='message_templates_select_own_restaurant') then
      drop policy "message_templates_select_own_restaurant" on public.message_templates;
    end if;
    if exists (select 1 from pg_policies where schemaname='public' and tablename='message_templates' and policyname='message_templates_insert_own_restaurant') then
      drop policy "message_templates_insert_own_restaurant" on public.message_templates;
    end if;
    if exists (select 1 from pg_policies where schemaname='public' and tablename='message_templates' and policyname='message_templates_update_own_restaurant') then
      drop policy "message_templates_update_own_restaurant" on public.message_templates;
    end if;
    if exists (select 1 from pg_policies where schemaname='public' and tablename='message_templates' and policyname='message_templates_delete_own_restaurant') then
      drop policy "message_templates_delete_own_restaurant" on public.message_templates;
    end if;

    execute $p$create policy "message_templates_select_own_restaurant"
      on public.message_templates for select
      using (restaurant_id = public.current_user_restaurant_id())$p$;
    execute $p$create policy "message_templates_insert_own_restaurant"
      on public.message_templates for insert
      with check (restaurant_id = public.current_user_restaurant_id())$p$;
    execute $p$create policy "message_templates_update_own_restaurant"
      on public.message_templates for update
      using (restaurant_id = public.current_user_restaurant_id())
      with check (restaurant_id = public.current_user_restaurant_id())$p$;
    execute $p$create policy "message_templates_delete_own_restaurant"
      on public.message_templates for delete
      using (restaurant_id = public.current_user_restaurant_id())$p$;
  end if;
end $$;

-- Semilla de plantillas por defecto para cada restaurante existente
insert into public.message_templates (restaurant_id, key, title, body)
select r.id, t.key, t.title, t.body
from public.restaurants r
cross join (
  values
    (
      'reservation_reminder',
      'Recordatorio de reserva',
      'Hola {{customerName}}, te recordamos tu reserva en {{restaurantName}} el {{reservationDate}} a las {{reservationTime}} para {{guests}} personas. ¡Te esperamos!'
    ),
    (
      'customer_reengagement',
      'Reactivación de cliente',
      'Hola {{customerName}}, hace tiempo que no vienes por {{restaurantName}}. Tu última visita fue el {{lastVisit}}. Tenemos novedades en carta y nos encantaría volver a verte.'
    ),
    (
      'post_visit_thanks',
      'Gracias por la visita',
      'Hola {{customerName}}, gracias por visitar {{restaurantName}}. Esperamos que hayas disfrutado. Si te apetece dejar una opinión, estaríamos encantados.'
    ),
    (
      'custom',
      'Mensaje personalizado',
      'Hola {{customerName}}, '
    )
) as t(key, title, body)
on conflict (restaurant_id, key) do nothing;

-- ============================
-- STEP 5 — menu_items (carta editable desde el dashboard)
-- ============================
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  section text not null,
  name text not null,
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  image_url text,
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menu_items_restaurant_idx on public.menu_items(restaurant_id);
create index if not exists menu_items_restaurant_section_idx on public.menu_items(restaurant_id, section, sort_order);

alter table public.menu_items enable row level security;

-- Lectura pública (la carta se muestra sin login)
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='menu_items' and policyname='menu_items_select_public') then
    drop policy "menu_items_select_public" on public.menu_items;
  end if;
end $$;

create policy "menu_items_select_public"
  on public.menu_items for select
  using (true);

do $$
declare
  has_helper boolean;
begin
  select exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'current_user_restaurant_id'
  ) into has_helper;

  if has_helper then
    if exists (select 1 from pg_policies where schemaname='public' and tablename='menu_items' and policyname='menu_items_insert_own_restaurant') then
      drop policy "menu_items_insert_own_restaurant" on public.menu_items;
    end if;
    if exists (select 1 from pg_policies where schemaname='public' and tablename='menu_items' and policyname='menu_items_update_own_restaurant') then
      drop policy "menu_items_update_own_restaurant" on public.menu_items;
    end if;
    if exists (select 1 from pg_policies where schemaname='public' and tablename='menu_items' and policyname='menu_items_delete_own_restaurant') then
      drop policy "menu_items_delete_own_restaurant" on public.menu_items;
    end if;

    execute $p$create policy "menu_items_insert_own_restaurant"
      on public.menu_items for insert
      with check (restaurant_id = public.current_user_restaurant_id())$p$;
    execute $p$create policy "menu_items_update_own_restaurant"
      on public.menu_items for update
      using (restaurant_id = public.current_user_restaurant_id())
      with check (restaurant_id = public.current_user_restaurant_id())$p$;
    execute $p$create policy "menu_items_delete_own_restaurant"
      on public.menu_items for delete
      using (restaurant_id = public.current_user_restaurant_id())$p$;
  end if;
end $$;

-- ============================
-- STEP 6 — Trigger para updated_at de menu_items
-- ============================
create or replace function public.tg_menu_items_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists menu_items_updated_at on public.menu_items;
create trigger menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.tg_menu_items_updated_at();
