/**
 * Datos de contacto y ubicación (ficha Google — Paco's Food, La Comida de Paco).
 * Usar solo desde aquí para evitar duplicar dirección o teléfono en la web.
 */
export const SITE_CONTACT = {
  brandLine: "Paco's Food, La Comida de Paco",
  shortPitch:
    "Comida casera, para llevar o comer allí. Escríbenos o llámanos para encargos y dudas.",

  streetLine: "C. la Morera, 27",
  cityLine: "21730 Almonte, Huelva",
  /** Una sola línea para pies de página */
  addressOneLine: "C. la Morera, 27 · 21730 Almonte, Huelva",

  phoneLocal: "642 39 58 68",
  phoneE164: "+34642395868",

  get telHref() {
    return `tel:${this.phoneE164.replace(/\s/g, "")}`;
  },
  get whatsappHref() {
    const n = this.phoneE164.replace("+", "");
    return `https://wa.me/${n}`;
  },

  /** Abre la ubicación en Google Maps (misma búsqueda que la ficha). */
  googleMapsSearchUrl:
    "https://www.google.com/maps/search/?api=1&query=C.%20la%20Morera%2C%2027%2C%2021730%20Almonte%2C%20Huelva%2C%20Spain",

  googleMapsEmbedUrl:
    "https://www.google.com/maps?q=C.%20la%20Morera%2C%2027%2C%2021730%20Almonte%2C%20Huelva&output=embed",

  /**
   * Horario según ficha de Google Maps (actualizar si cambia en Google).
   * Martes y miércoles: solo mediodía. Resto: mediodía + noche.
   */
  openingHours: [
    { day: "Lunes", slots: ["11:00 – 16:00", "20:00 – 23:00"] },
    { day: "Martes", slots: ["11:00 – 16:00"] },
    { day: "Miércoles", slots: ["11:00 – 16:00"] },
    { day: "Jueves", slots: ["11:00 – 16:00", "20:00 – 23:00"] },
    { day: "Viernes", slots: ["11:00 – 16:00", "20:00 – 23:00"] },
    { day: "Sábado", slots: ["11:00 – 16:00", "20:00 – 23:00"] },
    { day: "Domingo", slots: ["11:00 – 16:00", "20:00 – 23:00"] },
  ] as const,

  /** Una línea para pie de página o avisos breves. */
  hoursSummary:
    "Martes y miércoles: 11:00–16:00. Resto de días: 11:00–16:00 y 20:00–23:00 (Google Maps).",
} as const;
