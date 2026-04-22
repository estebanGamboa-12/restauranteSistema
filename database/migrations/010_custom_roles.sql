-- Custom roles: allow any role name (text) per restaurant.
-- This migration removes the strict enum-like checks that only allowed admin/manager/staff.
--
-- NOTE: Keep 'admin' as a special role in the app (always has all permissions).

-- 1) restaurant_staff.role: drop check constraint
do $$
begin
  -- Drop by name if it exists (Postgres auto-names constraints unless explicitly named).
  -- We search for any check constraint on restaurant_staff that references "role in".
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'restaurant_staff'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%role in (%'
  ) then
    execute (
      select 'alter table public.restaurant_staff drop constraint ' || quote_ident(c.conname)
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'restaurant_staff'
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ilike '%role in (%'
      limit 1
    );
  end if;
end $$;

-- 2) restaurant_role_permissions.role: drop check constraint
do $$
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'restaurant_role_permissions'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%role in (%'
  ) then
    execute (
      select 'alter table public.restaurant_role_permissions drop constraint ' || quote_ident(c.conname)
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'restaurant_role_permissions'
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ilike '%role in (%'
      limit 1
    );
  end if;
end $$;

-- 3) Ensure default rows exist for the classic roles (admin/manager/staff)
-- (idempotent: on conflict do nothing)
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

