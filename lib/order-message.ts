import type { Dish } from "@/lib/menu-data";

export type OrderLineItem = {
  dish: Pick<Dish, "id" | "name" | "price">;
  quantity: number;
};

export type OrderDraft = {
  name: string;
  phone: string;
  pickupTime: string; // "HH:mm"
  notes?: string;
  items: OrderLineItem[];
};

export function buildWhatsAppOrderMessage(draft: OrderDraft): string {
  const lines: string[] = [];
  lines.push(`Hola, quiero hacer un pedido para recoger a las ${draft.pickupTime}.`);
  lines.push("");

  for (const it of draft.items) {
    const qty = Math.max(1, Math.floor(it.quantity || 1));
    const priceSuffix = it.dish.price ? ` (${it.dish.price})` : "";
    lines.push(`- ${qty}x ${it.dish.name}${priceSuffix}`);
  }

  lines.push("");
  lines.push(`Nombre: ${draft.name}`);
  lines.push(`Tel: ${draft.phone}`);
  if (draft.notes && draft.notes.trim()) {
    lines.push(`Notas: ${draft.notes.trim()}`);
  }

  return lines.join("\n");
}

export function buildWaMeUrl(waMeBaseHref: string, message: string): string {
  const base = waMeBaseHref.split("?")[0];
  const encoded = encodeURIComponent(message);
  return `${base}?text=${encoded}`;
}

