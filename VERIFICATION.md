# Verificación Supabase SaaS

## 1. Migraciones

- **Orden documentado** en `database/README.md`: schema.sql → 001 → 002 → 003 → 004 → 005 → 006.
- **001**: Columnas en `restaurants` (opening_time, closing_time, etc.).
- **002**: Tablas `customers`, `reservation_tables`, `table_sessions`, `restaurant_settings`, `restaurant_staff`; no sustituye `reservations` si ya existe.
- **003**: RLS en todas las tablas tenant + `current_user_restaurant_id()`.
- **004**: Columna `email` en `restaurant_staff`.
- **005**: `reminder_hours_before` en `restaurant_settings`, `reminder_sent_at` en `reservations`.
- **006**: Columna `notes` en `reservations`.

## 2. RLS

- Políticas por tabla: SELECT, INSERT, UPDATE, DELETE filtrados por `restaurant_id = current_user_restaurant_id()`.
- `reservation_tables`: filtro vía EXISTS sobre `reservations.restaurant_id`.
- Helper `current_user_restaurant_id()` lee de `restaurant_staff` donde `user_id = auth.uid()`.

## 3. Multi-tenant

- **Dashboard**: Todas las rutas usan `requirePermission()` y `staff.restaurantId`; las consultas usan `.eq("restaurant_id", restaurantId)`.
- **Público**: `simple-create` y `table-zones` usan `NEXT_PUBLIC_RESTAURANT_ID`.
- **Cron**: Filtra por `restaurant_id` desde `restaurant_settings` y por reservas de esos restaurantes.

## 4. Roles (admin / manager / staff)

- Definidos en `lib/rbac.ts`; permisos por rol coherentes con la especificación.
- `lib/auth-dashboard.ts`: resolución de staff desde token o env; rol desde `restaurant_staff.role`.
- APIs del dashboard: cada ruta usa `requirePermission(req, "permission")` según la acción (reservations, reservations_delete, tables, tables_edit, settings, staff, payments).

## 5. Reservations CRUD

- **GET/POST** `/api/dashboard/reservations`: permiso `reservations`, filtro por `restaurantId`, GET con join `tables(name)` para mostrar mesa.
- **PUT/DELETE** `/api/dashboard/reservations/[id]`: PUT con permiso `reservations`, DELETE con permiso `reservations_delete`, ambos filtrados por `restaurant_id`.

## 6. Staff management

- **GET/POST** `/api/dashboard/staff`, **PUT/DELETE** `/api/dashboard/staff/[id]`: permiso `staff` (solo admin), filtro por `restaurant_id`. Creación vía Supabase Auth + fila en `restaurant_staff`.

## 7. Email reminders

- Configuración en `restaurant_settings`: `email_reminders_enabled`, `reminder_hours_before`.
- **Cron** `/api/cron/send-reminders`: protegido con `CRON_SECRET`; consulta reservas en ventana de recordatorio, envía con `sendReminderEmail()` y actualiza `reminder_sent_at` para no reenviar.

## Build

- `npm run build` ejecutado correctamente (solo warnings de `react-hooks/exhaustive-deps`).
