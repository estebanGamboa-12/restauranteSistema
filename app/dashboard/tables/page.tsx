"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuthProvider";
import { DashboardModal } from "@/components/dashboard/DashboardModal";
import { ConfirmModal } from "@/components/dashboard/ConfirmModal";
import {
  Plus,
  MapPinned,
  Users as UsersIcon,
  Pencil,
  Trash2,
} from "lucide-react";

type Zone = {
  id: string;
  name: string;
  capacity: number;
};

export default function TablesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", capacidad: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { showToast } = useToast();
  const { fetchWithAuth } = useDashboardAuth();

  useEffect(() => {
    void loadTables();
  }, []);

  async function loadTables() {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/dashboard/tables");
      const data = await res.json();
      if (res.ok && Array.isArray(data.tables)) {
        setZones(data.tables);
      } else {
        showToast({ type: "error", message: data.error ?? "Error al cargar" });
      }
    } catch {
      showToast({ type: "error", message: "Error al cargar las zonas" });
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ nombre: "", capacidad: "" });
    setModalOpen(true);
  }

  function openEdit(zone: Zone) {
    setEditingId(zone.id);
    setForm({ nombre: zone.name, capacidad: String(zone.capacity ?? "") });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      showToast({ type: "error", message: "El nombre es obligatorio" });
      return;
    }
    const capacidad = Number(form.capacidad);
    if (!Number.isFinite(capacidad) || capacidad <= 0) {
      showToast({ type: "error", message: "Indica una capacidad válida" });
      return;
    }
    setSaving(true);
    try {
      const payload = { nombre: form.nombre.trim(), capacidad };
      const res = await fetchWithAuth(
        editingId ? `/api/dashboard/tables/${editingId}` : "/api/dashboard/tables",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", message: data.error ?? "No se pudo guardar" });
      } else {
        showToast({
          type: "success",
          message: editingId ? "Zona actualizada" : "Zona creada",
        });
        setModalOpen(false);
        void loadTables();
      }
    } catch {
      showToast({ type: "error", message: "Error del servidor" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(null);
    try {
      const res = await fetchWithAuth(`/api/dashboard/tables/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", message: data.error ?? "No se pudo eliminar" });
      } else {
        showToast({ type: "success", message: "Zona eliminada" });
        void loadTables();
      }
    } catch {
      showToast({ type: "error", message: "Error del servidor" });
    }
  }

  const totalCapacity = zones.reduce((acc, z) => acc + (z.capacity ?? 0), 0);

  return (
    <div className="space-y-4 pb-24 sm:pb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-xalisco-cream sm:text-xl">
            Zonas y capacidad
          </h2>
          <p className="mt-1 text-xs text-xalisco-cream/60">
            Configura tus zonas (Salón, Terraza…) y la capacidad de comensales
            por zona.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="hidden items-center gap-1.5 self-start rounded-lg bg-xalisco-burnt-orange px-3 py-2 text-xs font-semibold text-xalisco-black shadow-lg shadow-xalisco-burnt-orange/30 hover:bg-xalisco-burnt-orange-hover sm:inline-flex sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Nueva zona
        </button>
      </div>

      {/* Resumen */}
      {!loading && zones.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
          <div className="rounded-xl border border-white/[0.06] bg-xalisco-black-soft/60 p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-xalisco-gold/15 text-xalisco-gold-bright">
                <MapPinned className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[9.5px] uppercase tracking-wider text-xalisco-cream/55">
                  Zonas
                </p>
                <p className="text-base font-bold text-xalisco-cream">
                  {zones.length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-xalisco-black-soft/60 p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-xalisco-burnt-orange/15 text-xalisco-burnt-orange">
                <UsersIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[9.5px] uppercase tracking-wider text-xalisco-cream/55">
                  Capacidad total
                </p>
                <p className="text-base font-bold text-xalisco-cream">
                  {totalCapacity}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-6 text-center text-xs text-xalisco-cream/60">
          Cargando zonas…
        </div>
      ) : zones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.1] bg-xalisco-black-soft/30 p-8 text-center">
          <MapPinned className="mx-auto h-8 w-8 text-xalisco-cream/40" />
          <p className="mt-2 text-sm font-medium text-xalisco-cream">
            Aún no hay zonas
          </p>
          <p className="mt-1 text-xs text-xalisco-cream/55">
            Crea la primera para que aparezca en el formulario de reservas.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-xalisco-burnt-orange px-3 py-2 text-xs font-semibold text-xalisco-black hover:bg-xalisco-burnt-orange-hover"
          >
            <Plus className="h-4 w-4" />
            Crear zona
          </button>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone) => (
            <li
              key={zone.id}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-4 transition hover:border-xalisco-gold/30"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-xalisco-burnt-orange/10 blur-2xl transition group-hover:bg-xalisco-burnt-orange/20" />
              <div className="relative flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-xalisco-burnt-orange/25 to-xalisco-gold/15 text-xalisco-gold-bright">
                  <MapPinned className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-xalisco-cream">
                    {zone.name}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-xalisco-cream/60">
                    <UsersIcon className="h-3 w-3" />
                    Capacidad {zone.capacity}
                  </p>
                </div>
              </div>
              <div className="relative mt-3 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(zone)}
                  className="inline-flex items-center gap-1 rounded-md border border-white/[0.12] px-2.5 py-1 text-[11px] text-xalisco-cream/85 hover:border-xalisco-gold/50 hover:text-xalisco-gold-bright"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(zone.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* FAB móvil */}
      <button
        type="button"
        onClick={openCreate}
        className="fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-xalisco-burnt-orange text-xalisco-black shadow-2xl shadow-xalisco-burnt-orange/40 transition hover:bg-xalisco-burnt-orange-hover active:scale-95 sm:hidden"
        aria-label="Nueva zona"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Modal crear/editar */}
      <DashboardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar zona" : "Nueva zona"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-xalisco-cream/75">
              Nombre de zona
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Salón, Terraza, Interior…"
              className="w-full rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none transition focus:border-xalisco-gold-bright/70"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-xalisco-cream/75">
              Capacidad (comensales)
            </label>
            <input
              type="number"
              min={1}
              value={form.capacidad}
              onChange={(e) =>
                setForm((f) => ({ ...f, capacidad: e.target.value }))
              }
              placeholder="Ej. 40"
              className="w-full rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none transition focus:border-xalisco-gold-bright/70"
              required
            />
            <p className="mt-1 text-[10.5px] text-xalisco-cream/50">
              Número máximo de personas sentadas simultáneamente en esta zona.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-white/[0.14] px-3 py-2 text-xs text-xalisco-cream/80 hover:border-white/30"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-xalisco-burnt-orange px-3 py-2 text-xs font-semibold text-xalisco-black hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
            >
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear zona"}
            </button>
          </div>
        </form>
      </DashboardModal>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="¿Eliminar zona?"
        message="Esta zona se eliminará. Las reservas asociadas pueden verse afectadas."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
