-- Permisos por rol configurables por el administrador (checkboxes por rol).
-- admin siempre tiene todo; manager y staff se configuran aquí.

create table if not exists public.restaurant_role_permissions (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  role text not null check (role in ('admin','manager','staff')),
  can_dashboard boolean not null default true,
  can_reservations boolean not null default true,
  can_reservations_delete boolean not null default true,
  can_tables boolean not null default true,
  can_tables_edit boolean not null default true,
  can_customers boolean not null default true,
  can_calendar boolean not null default true,
  can_settings boolean not null default false,
  can_staff boolean not null default false,
  can_payments boolean not null default false,
  can_table_checkin boolean not null default true,
  primary key (restaurant_id, role)
);

comment on table public.restaurant_role_permissions is
  'Permisos por rol; el admin puede editarlos (manager/staff). Admin siempre tiene todo.';

-- Valores por defecto: admin todo, manager sin settings/staff/payments, staff solo reservas/calendario/checkin
insert into public.restaurant_role_permissions (
  restaurant_id, role,
  can_dashboard, can_reservations, can_reservations_delete, can_tables, can_tables_edit,
  can_customers, can_calendar, can_settings, can_staff, can_payments, can_table_checkin
)
select id, 'admin', true, true, true, true, true, true, true, true, true, true, true
from public.restaurants
on conflict (restaurant_id, role) do nothing;

insert into public.restaurant_role_permissions (
  restaurant_id, role,
  can_dashboard, can_reservations, can_reservations_delete, can_tables, can_tables_edit,
  can_customers, can_calendar, can_settings, can_staff, can_payments, can_table_checkin
)
select id, 'manager', true, true, true, true, true, true, true, false, false, false, true
from public.restaurants
on conflict (restaurant_id, role) do nothing;

insert into public.restaurant_role_permissions (
  restaurant_id, role,
  can_dashboard, can_reservations, can_reservations_delete, can_tables, can_tables_edit,
  can_customers, can_calendar, can_settings, can_staff, can_payments, can_table_checkin
)
select id, 'staff', true, true, false, false, false, false, true, false, false, false, true
from public.restaurants
on conflict (restaurant_id, role) do nothing;

alter table public.restaurant_role_permissions enable row level security;

create policy "restaurant_role_permissions_select_own"
  on public.restaurant_role_permissions for select
  using (restaurant_id = public.current_user_restaurant_id());

create policy "restaurant_role_permissions_update_own"
  on public.restaurant_role_permissions for update
  using (restaurant_id = public.current_user_restaurant_id())
  with check (restaurant_id = public.current_user_restaurant_id());

create policy "restaurant_role_permissions_insert_own"
  on public.restaurant_role_permissions for insert
  with check (restaurant_id = public.current_user_restaurant_id());
