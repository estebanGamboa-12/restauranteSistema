# Base de datos Supabase – SaaS multi-tenant

## Orden de migraciones

Ejecutar en el **SQL Editor** de Supabase en este orden:

1. **schema.sql** – Tablas base: `restaurants`, `tables`, `reservations` (customer_name, table_id), `restaurant_users`, RPC `find_available_table`.
2. **migrations/001_restaurant_settings.sql** – Columnas de horario en `restaurants` (opening_time, closing_time, etc.).
3. **migrations/002_customers_reservations_settings_staff.sql** – `customers`, `reservation_tables`, `table_sessions`, `restaurant_settings`, `restaurant_staff`. (Si ya existe `reservations`, no se sustituye.)
4. **migrations/003_rls_multi_tenant.sql** – RLS en todas las tablas tenant y función `current_user_restaurant_id()`.
5. **migrations/004_staff_email.sql** – Columna `email` en `restaurant_staff`.
6. **migrations/005_reminder_config_and_sent.sql** – `reminder_hours_before` en `restaurant_settings`, `reminder_sent_at` en `reservations`.
7. **migrations/006_reservations_notes.sql** – Columna `notes` en `reservations` (opcional, para el panel).
8. **migrations/007_optimize_schema_constraints_indexes_rls.sql** – Restricción única `(user_id, restaurant_id)` en `restaurant_staff`, índices de rendimiento, función `get_current_restaurant_id()`, RLS en `restaurants`.
9. **migrations/008_role_permissions.sql** – Tabla `restaurant_role_permissions`: permisos por rol (manager, staff) configurables con checkboxes; admin tiene todo.

## Multi-tenant

- Todas las tablas de datos incluyen `restaurant_id` (salvo `restaurants`).
- Las políticas RLS filtran por `current_user_restaurant_id()` (usuario en `restaurant_staff`).
- Las APIs del dashboard usan `requirePermission()` y `staff.restaurantId` (service role para operaciones server-side).

## Roles (restaurant_staff.role)

| Rol     | Permisos |
|--------|----------|
| admin  | Todo; no se edita desde la UI. |
| manager| Configurable en Dashboard → Staff → Permisos por rol. |
| staff  | Configurable en Dashboard → Staff → Permisos por rol. |

Los permisos se leen de `restaurant_role_permissions`. El administrador elige con checkboxes qué puede ver cada rol (Reservas, Calendario, Mesas, Clientes, Pagos, Ajustes, Staff, etc.).

## Recordatorios por email

- Configuración en `restaurant_settings`: `email_reminders_enabled`, `reminder_hours_before`.
- Envío: job en `/api/cron/send-reminders` (protegido con `CRON_SECRET`).
- Cada reserva se recuerda solo una vez (campo `reminder_sent_at`).
