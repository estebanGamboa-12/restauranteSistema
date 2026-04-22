"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuthProvider";
import { DashboardModal } from "@/components/dashboard/DashboardModal";
import { ConfirmModal } from "@/components/dashboard/ConfirmModal";
import {
  Plus,
  Pencil,
  Trash2,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";

type MenuItem = {
  id: string;
  section: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  available: boolean;
  sort_order: number;
};

const EMPTY_FORM: Omit<MenuItem, "id"> = {
  section: "",
  name: "",
  description: "",
  price_cents: 0,
  image_url: "",
  available: true,
  sort_order: 0,
};

function centsToEuroInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

function euroInputToCents(value: string): number {
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100));
}

export default function MenuAdminPage() {
  const { fetchWithAuth } = useDashboardAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<MenuItem, "id">>(EMPTY_FORM);
  const [priceText, setPriceText] = useState("0.00");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/dashboard/menu");
      const data = await res.json();
      if (res.ok) {
        setItems(Array.isArray(data.items) ? data.items : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        it.section.toLowerCase().includes(q) ||
        (it.description ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const it of filtered) {
      if (!map.has(it.section)) map.set(it.section, []);
      map.get(it.section)!.push(it);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const totalAvailable = useMemo(
    () => items.filter((i) => i.available).length,
    [items]
  );

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPriceText("0.00");
    setModalOpen(true);
  }

  function openEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      section: item.section,
      name: item.name,
      description: item.description ?? "",
      price_cents: item.price_cents,
      image_url: item.image_url ?? "",
      available: item.available,
      sort_order: item.sort_order,
    });
    setPriceText(centsToEuroInput(item.price_cents));
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.section.trim() || !form.name.trim()) {
      showToast({ type: "error", message: "Sección y nombre son obligatorios." });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        section: form.section.trim(),
        name: form.name.trim(),
        description: form.description?.toString().trim() || null,
        price_cents: euroInputToCents(priceText),
        image_url: form.image_url?.toString().trim() || null,
        available: form.available,
        sort_order: form.sort_order,
      };
      const res = await fetchWithAuth(
        editingId ? `/api/dashboard/menu/${editingId}` : "/api/dashboard/menu",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast({
          type: "error",
          message: data.error ?? "No se pudo guardar.",
        });
      } else {
        showToast({ type: "success", message: "Carta actualizada." });
        setModalOpen(false);
        await load();
      }
    } catch {
      showToast({ type: "error", message: "No se pudo guardar." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetchWithAuth(`/api/dashboard/menu/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        showToast({
          type: "error",
          message: data.error ?? "No se pudo eliminar.",
        });
      } else {
        showToast({ type: "success", message: "Artículo eliminado." });
        await load();
      }
    } catch {
      showToast({ type: "error", message: "No se pudo eliminar." });
    }
  }

  return (
    <div className="space-y-4 pb-24 sm:pb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-xalisco-cream sm:text-xl">
            Carta
          </h2>
          <p className="mt-1 text-xs text-xalisco-cream/60">
            Gestiona secciones y platos. Los cambios se publican al instante en
            la web.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="hidden items-center gap-1.5 self-start rounded-lg bg-xalisco-burnt-orange px-3 py-2 text-xs font-semibold text-xalisco-black shadow-lg shadow-xalisco-burnt-orange/30 hover:bg-xalisco-burnt-orange-hover sm:inline-flex sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Nuevo plato
        </button>
      </div>

      {/* Resumen + buscador */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-xalisco-black-soft/60 px-3 py-2">
            <p className="text-[9.5px] uppercase tracking-wider text-xalisco-cream/55">
              Platos
            </p>
            <p className="text-sm font-bold text-xalisco-cream">
              {items.length}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-xalisco-black-soft/60 px-3 py-2">
            <p className="text-[9.5px] uppercase tracking-wider text-xalisco-cream/55">
              Disponibles
            </p>
            <p className="text-sm font-bold text-emerald-300">
              {totalAvailable}
            </p>
          </div>
        </div>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-xalisco-cream/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar plato o sección…"
            className="w-full rounded-lg border border-white/[0.12] bg-black/25 pl-9 pr-3 py-2 text-xs text-xalisco-cream placeholder:text-xalisco-cream/40 outline-none transition focus:border-xalisco-gold-bright/70"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-6 text-center text-xs text-xalisco-cream/60">
          Cargando carta…
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.1] bg-xalisco-black-soft/30 p-8 text-center">
          <UtensilsCrossed className="mx-auto h-8 w-8 text-xalisco-cream/40" />
          <p className="mt-2 text-sm font-medium text-xalisco-cream">
            {search ? "Sin resultados" : "Aún no hay platos"}
          </p>
          <p className="mt-1 text-xs text-xalisco-cream/55">
            {search
              ? "Prueba con otra búsqueda."
              : "Crea el primero para que aparezca en la web."}
          </p>
          {!search && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-xalisco-burnt-orange px-3 py-2 text-xs font-semibold text-xalisco-black hover:bg-xalisco-burnt-orange-hover"
            >
              <Plus className="h-4 w-4" />
              Crear plato
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([section, rows]) => (
            <div
              key={section}
              className="overflow-hidden rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] bg-gradient-to-r from-white/[0.04] to-transparent px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-xalisco-gold-bright" />
                  <h3 className="text-sm font-semibold text-xalisco-cream">
                    {section}
                  </h3>
                </div>
                <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium text-xalisco-cream/70">
                  {rows.length} {rows.length === 1 ? "plato" : "platos"}
                </span>
              </div>

              {/* Vista móvil: cards */}
              <ul className="divide-y divide-white/[0.05] sm:hidden">
                {rows.map((it) => (
                  <li key={it.id} className="flex gap-3 p-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-black/30">
                      {it.image_url ? (
                        <Image
                          src={it.image_url}
                          alt={it.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xalisco-cream/30">
                          <UtensilsCrossed className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-xalisco-cream">
                          {it.name}
                        </p>
                        <span className="shrink-0 text-sm font-bold text-xalisco-gold-bright">
                          {centsToEuroInput(it.price_cents)} €
                        </span>
                      </div>
                      {it.description && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-xalisco-cream/60">
                          {it.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            it.available
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          {it.available ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {it.available ? "Visible" : "Oculto"}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEdit(it)}
                          className="ml-auto inline-flex items-center gap-1 rounded-md border border-white/[0.12] px-2 py-1 text-[10px] text-xalisco-cream/85 hover:border-xalisco-gold/50 hover:text-xalisco-gold-bright"
                          aria-label="Editar plato"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(it.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/10"
                          aria-label="Eliminar plato"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Vista desktop: tabla */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="min-w-full text-left text-[12px]">
                  <thead className="bg-white/[0.03] text-xalisco-cream/65">
                    <tr>
                      <th className="px-3 py-2 font-medium">Plato</th>
                      <th className="px-3 py-2 font-medium">Descripción</th>
                      <th className="px-3 py-2 font-medium">Precio</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                      <th className="px-3 py-2 font-medium">Orden</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {rows.map((it) => (
                      <tr
                        key={it.id}
                        className="transition hover:bg-white/[0.02]"
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-black/30">
                              {it.image_url ? (
                                <Image
                                  src={it.image_url}
                                  alt={it.name}
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="grid h-full w-full place-items-center text-xalisco-cream/30">
                                  <UtensilsCrossed className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <span className="font-medium text-xalisco-cream">
                              {it.name}
                            </span>
                          </div>
                        </td>
                        <td className="max-w-[280px] truncate px-3 py-2 text-xalisco-cream/65">
                          {it.description ?? "—"}
                        </td>
                        <td className="px-3 py-2 font-semibold text-xalisco-gold-bright">
                          {centsToEuroInput(it.price_cents)} €
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              it.available
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-red-500/15 text-red-300"
                            }`}
                          >
                            {it.available ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {it.available ? "Visible" : "Oculto"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xalisco-cream/65">
                          {it.sort_order}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(it)}
                              className="inline-flex items-center gap-1 rounded-md border border-white/[0.12] px-2 py-1 text-[10px] text-xalisco-cream/85 hover:border-xalisco-gold/50 hover:text-xalisco-gold-bright"
                            >
                              <Pencil className="h-3 w-3" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(it.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3 w-3" />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB móvil */}
      <button
        type="button"
        onClick={openCreate}
        className="fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-xalisco-burnt-orange text-xalisco-black shadow-2xl shadow-xalisco-burnt-orange/40 transition hover:bg-xalisco-burnt-orange-hover active:scale-95 sm:hidden"
        aria-label="Nuevo plato"
      >
        <Plus className="h-6 w-6" />
      </button>

      <DashboardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar plato" : "Nuevo plato"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="grid gap-3 text-xs sm:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-1 text-xalisco-cream/80">Sección</label>
            <input
              type="text"
              value={form.section}
              onChange={(e) =>
                setForm((f) => ({ ...f, section: e.target.value }))
              }
              placeholder="Bocadillos"
              className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1.5 text-xalisco-cream outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xalisco-cream/80">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1.5 text-xalisco-cream outline-none"
            />
          </div>
          <div className="flex flex-col sm:col-span-2">
            <label className="mb-1 text-xalisco-cream/80">Descripción</label>
            <textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1.5 text-xalisco-cream outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xalisco-cream/80">Precio (€)</label>
            <input
              type="text"
              inputMode="decimal"
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1.5 text-xalisco-cream outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xalisco-cream/80">Orden</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  sort_order: Number(e.target.value) || 0,
                }))
              }
              className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1.5 text-xalisco-cream outline-none"
            />
          </div>
          <div className="flex flex-col sm:col-span-2">
            <label className="mb-1 text-xalisco-cream/80">Imagen (URL)</label>
            <input
              type="text"
              value={form.image_url ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, image_url: e.target.value }))
              }
              placeholder="/comida/archivo.jpg"
              className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1.5 text-xalisco-cream outline-none"
            />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) =>
                setForm((f) => ({ ...f, available: e.target.checked }))
              }
              className="h-4 w-4 rounded border-white/30 bg-transparent text-xalisco-burnt-orange focus:ring-xalisco-gold/40"
            />
            <span className="text-xalisco-cream/85">
              Disponible (visible en la carta pública)
            </span>
          </label>
          <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-md border border-white/[0.12] px-3 py-1.5 text-xalisco-cream/85 hover:border-xalisco-gold/50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-xalisco-burnt-orange px-3 py-1.5 font-semibold text-xalisco-black hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </DashboardModal>

      <ConfirmModal
        open={!!deleteId}
        title="Eliminar plato"
        message="Esta acción es permanente."
        confirmLabel="Eliminar"
        variant="danger"
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await handleDelete(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}
