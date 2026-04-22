/**
 * site-content.ts
 *
 * CMS ligero para la web pública. Cada "sección" tiene un schema tipado y
 * unos valores por defecto. La BBDD puede sobrescribir esos valores.
 * Los componentes cliente usan useSiteContent(section) (ver SiteContentProvider)
 * y reciben siempre un objeto válido (mergeado con defaults).
 */

export type GlobalContent = {
  brand_name: string;
  tagline: string;
  location_short: string;
};

export type HomeHeroContent = {
  eyebrow_tagline: string[];
  title_line_1: string;
  title_line_2: string;
  subtitle: string;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  open_today_label: string;
  rating_label: string;
  sticker_line_1: string;
  sticker_line_2: string;
  image_main_url: string;
  image_floating_url: string;
};

export type StoryPillar = { id: string; title: string; copy: string };
export type StoryStat = { value: number; suffix: string; label: string };

export type HomeStoryContent = {
  eyebrow: string;
  title: string;
  quote: string;
  pillars: StoryPillar[];
  stats: StoryStat[];
  marquee_words: string[];
};

export type HomeReserveCtaContent = {
  eyebrow: string;
  title_line_1: string;
  title_line_2: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  image_url: string;
};

export type HomeLocationContent = {
  eyebrow: string;
  title: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  hours_weekdays: string;
  hours_weekend: string;
  map_query: string;
};

export type FooterContent = {
  marquee_words: string[];
  big_logo: string;
  copyright: string;
  social_instagram: string;
  social_facebook: string;
  social_tiktok: string;
};

export type ContactoContent = {
  eyebrow: string;
  title_line_1: string;
  title_line_2: string;
  subtitle: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
};

export type RooftopGalleryItem = {
  id: number;
  src: string;
  title: string;
  caption: string;
  span?: "tall" | "wide" | "square";
};

export type RooftopContent = {
  eyebrow: string;
  title_line_1: string;
  title_line_2: string;
  subtitle: string;
  gallery: RooftopGalleryItem[];
};

export type SiteContentMap = {
  global: GlobalContent;
  "home.hero": HomeHeroContent;
  "home.story": HomeStoryContent;
  "home.reserve_cta": HomeReserveCtaContent;
  "home.location": HomeLocationContent;
  footer: FooterContent;
  contacto: ContactoContent;
  rooftop: RooftopContent;
};

export type SiteSectionKey = keyof SiteContentMap;

export const SITE_CONTENT_DEFAULTS: SiteContentMap = {
  global: {
    brand_name: "Paco's Food",
    tagline: "La Comida de Paco",
    location_short: "Almonte · Huelva",
  },
  "home.hero": {
    eyebrow_tagline: ["Paco's", "Food", "2026"],
    title_line_1: "La Comida",
    title_line_2: "de Paco.",
    subtitle:
      "Cocina mediterránea, producto fresco y el sabor de casa. Ven a comer al local o llévatelo — en Almonte, desde siempre.",
    cta_primary_label: "Reserva tu mesa",
    cta_primary_href: "/reservas",
    cta_secondary_label: "Ver la carta",
    cta_secondary_href: "/menu",
    open_today_label: "Abierto hoy",
    rating_label: "4.8 ★ / 200+",
    sticker_line_1: "Desde",
    sticker_line_2: "siempre",
    image_main_url: "/hero.jpg",
    image_floating_url: "/bebida1.jpg",
  },
  "home.story": {
    eyebrow: "Manifesto",
    title: "Sitio de barrio. Sabor de siempre.",
    quote:
      "Comida casera, con producto fresco y mimo de barrio. Aquí se cocina como en casa — sin prisa, con cariño, para que vengas más de una vez.",
    pillars: [
      { id: "01", title: "Cocina casera", copy: "Fogón real. Platos de cuchara. Sabores que recuerdas." },
      { id: "02", title: "Producto fresco", copy: "Mercado local, pescado del día, brasa y arroz." },
      { id: "03", title: "Ambiente", copy: "Un sitio cercano, sin prisas, para comer bien en Almonte." },
      { id: "04", title: "Para llevar", copy: "Encarga por teléfono y pásate cuando quieras." },
    ],
    stats: [
      { value: 20, suffix: "+", label: "Años abiertos" },
      { value: 200, suffix: "+", label: "Reseñas 4.8★" },
      { value: 15, suffix: "", label: "Platos de la casa" },
      { value: 100, suffix: "%", label: "Producto fresco" },
    ],
    marquee_words: [
      "Mediterráneo",
      "Brasa",
      "Arroces",
      "Casera",
      "Frescura",
      "Tradición",
      "Sobremesa",
      "Producto",
      "Hogar",
    ],
  },
  "home.reserve_cta": {
    eyebrow: "Ven a comer",
    title_line_1: "Reserva",
    title_line_2: "tu mesa.",
    subtitle: "Comemos juntos. Reserva online en 30 segundos.",
    cta_label: "Reservar ahora",
    cta_href: "/reservas",
    image_url: "/local1.jpg",
  },
  "home.location": {
    eyebrow: "Dónde encontrarnos",
    title: "En el corazón de Almonte.",
    address: "Calle Principal, 1",
    city: "Almonte, Huelva",
    phone: "+34 959 000 000",
    email: "hola@pacosfood.es",
    hours_weekdays: "Lun–Vie · 13:00–16:00 / 20:00–23:30",
    hours_weekend: "Sáb–Dom · 13:00–17:00 / 20:00–00:00",
    map_query: "Almonte, Huelva",
  },
  footer: {
    marquee_words: [
      "Reservas online",
      "Para llevar",
      "Cocina casera",
      "Almonte · Huelva",
      "Desde siempre",
    ],
    big_logo: "PACO'S FOOD",
    copyright: "© Paco's Food · Almonte",
    social_instagram: "",
    social_facebook: "",
    social_tiktok: "",
  },
  contacto: {
    eyebrow: "Contacto",
    title_line_1: "Hablemos",
    title_line_2: "de comida.",
    subtitle: "Para reservas, encargos o dudas — escríbenos o llámanos.",
    phone: "+34 959 000 000",
    email: "hola@pacosfood.es",
    whatsapp: "+34 600 000 000",
    address: "Calle Principal, 1, Almonte (Huelva)",
  },
  rooftop: {
    eyebrow: "El local",
    title_line_1: "El",
    title_line_2: "local.",
    subtitle:
      "Un espacio cercano en Almonte. Madera, luz baja y servicio sin prisas. Hecho para compartir mesa.",
    gallery: [
      { id: 1, src: "/local1.jpg", title: "Terraza", caption: "Mesa al aire libre", span: "tall" },
      { id: 2, src: "/local3.jpg", title: "Interior", caption: "Luz cálida y madera", span: "square" },
      { id: 3, src: "/localnoche.jpg", title: "Noche", caption: "Cuando todo se ilumina", span: "wide" },
      { id: 4, src: "/local2.jpg", title: "Detalle", caption: "Preparado al servicio", span: "square" },
      { id: 5, src: "/bebida1.jpg", title: "Bebida", caption: "Copa fría y sobremesa", span: "tall" },
      { id: 6, src: "/local3.jpg", title: "Sobremesa", caption: "Tomarse el tiempo", span: "square" },
    ],
  },
};

export const SITE_SECTION_KEYS: SiteSectionKey[] = [
  "global",
  "home.hero",
  "home.story",
  "home.reserve_cta",
  "home.location",
  "footer",
  "contacto",
  "rooftop",
];

export type SiteContentRow = {
  section_key: string;
  content: Record<string, unknown>;
};

/**
 * Mergea defaults con overrides de BBDD (shallow). Para campos que sean arrays
 * u objetos complejos, si hay override (incluso parcial) se usa el override
 * completo, para que el cliente pueda sustituir listas enteras desde dashboard.
 */
export function mergeSiteContent(
  overrides: Record<string, Record<string, unknown>>
): SiteContentMap {
  const merged = {} as SiteContentMap;
  for (const key of SITE_SECTION_KEYS) {
    const defaultSection = SITE_CONTENT_DEFAULTS[key] as Record<string, unknown>;
    const override = overrides?.[key];
    if (!override) {
      (merged as Record<string, unknown>)[key] = defaultSection;
      continue;
    }
    (merged as Record<string, unknown>)[key] = { ...defaultSection, ...override };
  }
  return merged;
}
