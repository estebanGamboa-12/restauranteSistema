-- ============================
-- EJEMPLOS PARA NUEVOS CLIENTES (RESTAURANTES)
-- ============================

insert into public.restaurants (
  name,
  slug,
  email,
  phone,
  address,
  city,
  country,
  stripe_account_id,
  deposit_amount
) values (
  'Nombre del Restaurante',             -- nombre del restaurante
  'slug-restaurante',                   -- slug único (para URLs)
  'reservas@restaurante.com',           -- email de reservas
  '+34 600 00 00 00',                   -- teléfono
  'Dirección completa',                 -- dirección
  'Ciudad',                             -- ciudad
  'País',                               -- país
  null,                                 -- stripe_account_id (rellénalo al conectar Stripe)
  1000                                  -- depósito en céntimos (ej. 10,00 €)
)
returning id;


