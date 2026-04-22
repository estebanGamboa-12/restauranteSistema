export type MessageTemplateKey =
  | "reservation_reminder"
  | "customer_reengagement"
  | "post_visit_thanks"
  | "custom";

export interface MessageTemplate {
  key: MessageTemplateKey;
  title: string;
  body: string;
  updated_at?: string | null;
}

export const DEFAULT_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    key: "reservation_reminder",
    title: "Recordatorio de reserva",
    body:
      "Hola {{customerName}}, te recordamos tu reserva en {{restaurantName}} el {{reservationDate}} a las {{reservationTime}} para {{guests}} personas. ¡Te esperamos!",
  },
  {
    key: "customer_reengagement",
    title: "Reactivación de cliente",
    body:
      "Hola {{customerName}}, hace tiempo que no vienes por {{restaurantName}}. Tu última visita fue el {{lastVisit}}. Tenemos novedades en carta y nos encantaría volver a verte.",
  },
  {
    key: "post_visit_thanks",
    title: "Gracias por la visita",
    body:
      "Hola {{customerName}}, gracias por visitar {{restaurantName}}. Esperamos que hayas disfrutado. Si te apetece dejar una opinión, estaríamos encantados.",
  },
  {
    key: "custom",
    title: "Mensaje personalizado",
    body: "Hola {{customerName}}, ",
  },
];

export const TEMPLATE_VARIABLES: { name: string; description: string }[] = [
  { name: "{{customerName}}", description: "Nombre del cliente" },
  { name: "{{restaurantName}}", description: "Nombre del restaurante" },
  { name: "{{lastVisit}}", description: "Fecha de la última visita" },
  { name: "{{reservationDate}}", description: "Fecha de la reserva" },
  { name: "{{reservationTime}}", description: "Hora de la reserva" },
  { name: "{{guests}}", description: "Nº de personas" },
];

export type TemplateVariables = {
  customerName?: string;
  restaurantName?: string;
  lastVisit?: string;
  reservationDate?: string;
  reservationTime?: string;
  guests?: number | string;
};

export function renderMessageTemplate(
  body: string,
  vars: TemplateVariables
): string {
  const mapping: Record<string, string> = {
    "{{customerName}}": vars.customerName?.toString() ?? "",
    "{{restaurantName}}": vars.restaurantName?.toString() ?? "",
    "{{lastVisit}}": vars.lastVisit?.toString() ?? "",
    "{{reservationDate}}": vars.reservationDate?.toString() ?? "",
    "{{reservationTime}}": vars.reservationTime?.toString() ?? "",
    "{{guests}}":
      vars.guests !== undefined && vars.guests !== null
        ? String(vars.guests)
        : "",
  };
  let out = body ?? "";
  for (const [k, v] of Object.entries(mapping)) {
    out = out.split(k).join(v);
  }
  return out;
}

/** Devuelve un enlace wa.me listo para abrir con el mensaje prefijado. */
export function buildWhatsappLink(phone: string, message: string): string {
  const clean = (phone ?? "").replace(/[^0-9]/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${text}`;
}
