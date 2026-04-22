-- 015: site_content — CMS ligero para que el cliente edite los textos, imágenes
--       y secciones de la web pública (hero, manifesto, stats, CTA, footer, etc.)
--       sin tocar código. Cada sección es una fila con clave + JSON.
--
-- Idempotente: seguro de re-ejecutar.

-- ============================
-- TABLA
-- ============================
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  section_key text not null,
  content jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists site_content_restaurant_section_uniq
  on public.site_content(restaurant_id, section_key);

create index if not exists site_content_section_idx
  on public.site_content(section_key);

-- ============================
-- TRIGGER updated_at
-- ============================
create or replace function public.site_content_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_content_updated_at on public.site_content;
create trigger site_content_updated_at
before update on public.site_content
for each row execute function public.site_content_touch_updated_at();

-- ============================
-- RLS — lectura pública, escritura solo staff autorizado
-- ============================
alter table public.site_content enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='site_content' and policyname='site_content_public_select') then
    drop policy "site_content_public_select" on public.site_content;
  end if;
end $$;

-- Cualquiera (anon/auth) puede leer el contenido publicado.
create policy "site_content_public_select"
  on public.site_content for select
  using (true);

-- La escritura se hace desde el server con service role (bypass RLS),
-- por lo que no definimos políticas de insert/update para roles anónimos.
-- Si se quisiera restringir a staff vía RLS auth, se añadiría aquí.

-- ============================
-- SEED: contenido por defecto para el restaurante principal
-- (se hace best-effort: si hay restaurantes, siembra contenido base).
-- ============================
do $$
declare
  rid uuid;
begin
  select id into rid from public.restaurants order by created_at asc limit 1;
  if rid is null then
    return;
  end if;

  insert into public.site_content (restaurant_id, section_key, content)
  values
    (rid, 'global', jsonb_build_object(
      'brand_name', 'Paco''s Food',
      'tagline', 'La Comida de Paco',
      'location_short', 'Almonte · Huelva'
    )),
    (rid, 'home.hero', jsonb_build_object(
      'eyebrow_tagline', ARRAY['Paco''s', 'Food', '2026'],
      'title_line_1', 'La Comida',
      'title_line_2', 'de Paco.',
      'subtitle', 'Cocina mediterránea, producto fresco y el sabor de casa. Ven a comer al local o llévatelo — en Almonte, desde siempre.',
      'cta_primary_label', 'Reserva tu mesa',
      'cta_primary_href', '/reservas',
      'cta_secondary_label', 'Ver la carta',
      'cta_secondary_href', '/menu',
      'open_today_label', 'Abierto hoy',
      'rating_label', '4.8 ★ / 200+',
      'sticker_line_1', 'Desde',
      'sticker_line_2', 'siempre',
      'image_main_url', '/hero.jpg',
      'image_floating_url', '/bebida1.jpg'
    )),
    (rid, 'home.story', jsonb_build_object(
      'eyebrow', 'Manifesto',
      'title', 'Sitio de barrio. Sabor de siempre.',
      'quote', 'Comida casera, con producto fresco y mimo de barrio. Aquí se cocina como en casa — sin prisa, con cariño, para que vengas más de una vez.',
      'pillars', jsonb_build_array(
        jsonb_build_object('id','01','title','Cocina casera','copy','Fogón real. Platos de cuchara. Sabores que recuerdas.'),
        jsonb_build_object('id','02','title','Producto fresco','copy','Mercado local, pescado del día, brasa y arroz.'),
        jsonb_build_object('id','03','title','Ambiente','copy','Un sitio cercano, sin prisas, para comer bien en Almonte.'),
        jsonb_build_object('id','04','title','Para llevar','copy','Encarga por teléfono y pásate cuando quieras.')
      ),
      'stats', jsonb_build_array(
        jsonb_build_object('value',20,'suffix','+','label','Años abiertos'),
        jsonb_build_object('value',200,'suffix','+','label','Reseñas 4.8★'),
        jsonb_build_object('value',15,'suffix','','label','Platos de la casa'),
        jsonb_build_object('value',100,'suffix','%','label','Producto fresco')
      ),
      'marquee_words', ARRAY['Mediterráneo','Brasa','Arroces','Casera','Frescura','Tradición','Sobremesa','Producto','Hogar']
    )),
    (rid, 'home.reserve_cta', jsonb_build_object(
      'eyebrow', 'Ven a comer',
      'title_line_1', 'Reserva',
      'title_line_2', 'tu mesa.',
      'subtitle', 'Comemos juntos. Reserva online en 30 segundos.',
      'cta_label', 'Reservar ahora',
      'cta_href', '/reservas',
      'image_url', '/local1.jpg'
    )),
    (rid, 'home.location', jsonb_build_object(
      'eyebrow', 'Dónde encontrarnos',
      'title', 'En el corazón de Almonte.',
      'address', 'Calle Principal, 1',
      'city', 'Almonte, Huelva',
      'phone', '+34 959 000 000',
      'email', 'hola@pacosfood.es',
      'hours_weekdays', 'Lun–Vie · 13:00–16:00 / 20:00–23:30',
      'hours_weekend', 'Sáb–Dom · 13:00–17:00 / 20:00–00:00',
      'map_query', 'Almonte, Huelva'
    )),
    (rid, 'footer', jsonb_build_object(
      'marquee_words', ARRAY['Reservas online','Para llevar','Cocina casera','Almonte · Huelva','Desde siempre'],
      'big_logo', 'PACO''S FOOD',
      'copyright', '© Paco''s Food · Almonte',
      'social_instagram', '',
      'social_facebook', '',
      'social_tiktok', ''
    )),
    (rid, 'contacto', jsonb_build_object(
      'eyebrow', 'Contacto',
      'title_line_1', 'Hablemos',
      'title_line_2', 'de comida.',
      'subtitle', 'Para reservas, encargos o dudas — escríbenos o llámanos.',
      'phone', '+34 959 000 000',
      'email', 'hola@pacosfood.es',
      'whatsapp', '+34 600 000 000',
      'address', 'Calle Principal, 1, Almonte (Huelva)'
    )),
    (rid, 'rooftop', jsonb_build_object(
      'eyebrow', 'El local',
      'title_line_1', 'El',
      'title_line_2', 'local.',
      'subtitle', 'Un espacio cercano en Almonte. Madera, luz baja y servicio sin prisas. Hecho para compartir mesa.',
      'gallery', jsonb_build_array(
        jsonb_build_object('id',1,'src','/local1.jpg','title','Terraza','caption','Mesa al aire libre','span','tall'),
        jsonb_build_object('id',2,'src','/local3.jpg','title','Interior','caption','Luz cálida y madera','span','square'),
        jsonb_build_object('id',3,'src','/localnoche.jpg','title','Noche','caption','Cuando todo se ilumina','span','wide'),
        jsonb_build_object('id',4,'src','/local2.jpg','title','Detalle','caption','Preparado al servicio','span','square'),
        jsonb_build_object('id',5,'src','/bebida1.jpg','title','Bebida','caption','Copa fría y sobremesa','span','tall'),
        jsonb_build_object('id',6,'src','/local3.jpg','title','Sobremesa','caption','Tomarse el tiempo','span','square')
      )
    ))
  on conflict (restaurant_id, section_key) do nothing;
end $$;
