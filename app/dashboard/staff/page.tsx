"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuthProvider";
import { DashboardModal } from "@/components/dashboard/DashboardModal";
import { ConfirmModal } from "@/components/dashboard/ConfirmModal";
import {
  Plus,
  Pencil,
  Trash2,
  UserCog,
  Shield,
  ChevronDown,
  ChevronUp,
  Mail,
  UserPlus,
  Save,
  Search,
} from "lucide-react";

type StaffRole = string;

type StaffRow = {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: StaffRole;
  created_at: string;
};

function roleLabel(role: string) {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  if (role === "staff") return "Staff";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function roleTone(role: string) {
  if (role === "admin")
    return "bg-xalisco-burnt-orange/20 text-xalisco-burnt-orange border-xalisco-burnt-orange/40";
  if (role === "manager")
    return "bg-xalisco-gold/20 text-xalisco-gold-bright border-xalisco-gold/40";
  if (role === "staff")
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
}

function initialsOf(name: string | null, email: string | null) {
  const src = (name ?? email ?? "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

type RolePermRow = {
  role: string;
  can_dashboard: boolean;
  can_reservations: boolean;
  can_reservations_delete: boolean;
  can_menu: boolean;
  can_tables: boolean;
  can_tables_edit: boolean;
  can_customers: boolean;
  can_calendar: boolean;
  can_settings: boolean;
  can_staff: boolean;
  can_payments: boolean;
  can_table_checkin: boolean;
};

const PERM_LABELS: { key: keyof Omit<RolePermRow, "role">; label: string }[] = [
  { key: "can_dashboard", label: "Panel" },
  { key: "can_reservations", label: "Reservas" },
  { key: "can_reservations_delete", label: "Eliminar reservas" },
  { key: "can_calendar", label: "Calendario" },
  { key: "can_menu", label: "Carta" },
  { key: "can_tables", label: "Mesas" },
  { key: "can_tables_edit", label: "Editar mesas" },
  { key: "can_customers", label: "Clientes" },
  { key: "can_payments", label: "Pagos" },
  { key: "can_settings", label: "Ajustes" },
  { key: "can_staff", label: "Staff" },
  { key: "can_table_checkin", label: "Check-in mesa" },
];

export default function StaffPage() {
  const [list, setList] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rolePerms, setRolePerms] = useState<RolePermRow[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const [deleteRoleName, setDeleteRoleName] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<StaffRow | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff" as StaffRole,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff" as StaffRole,
  });
  const [newRoleName, setNewRoleName] = useState("");
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const { fetchWithAuth } = useDashboardAuth();
  const { showToast } = useToast();

  useEffect(() => {
    loadStaff();
    loadRolePermissions();
  }, []);

  async function loadRolePermissions() {
    try {
      const res = await fetchWithAuth("/api/dashboard/role-permissions");
      const data = await res.json();
      if (res.ok && Array.isArray(data.permissions)) {
        const rows = (data.permissions as RolePermRow[]).slice();
        setRolePerms(rows.sort((a, b) => a.role.localeCompare(b.role)));
      }
    } catch {
      // ignore
    }
  }

  async function saveRolePermissions(role: string, row: RolePermRow) {
    setSavingPerms(true);
    try {
      const res = await fetchWithAuth("/api/dashboard/role-permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          ...Object.fromEntries(
            PERM_LABELS.map((p) => [p.key, row[p.key]])
          ),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", message: data.error ?? "Error al guardar" });
        return;
      }
      showToast({ type: "success", message: "Permisos guardados" });
      void loadRolePermissions();
    } catch {
      showToast({ type: "error", message: "Error del servidor" });
    } finally {
      setSavingPerms(false);
    }
  }

  function setPerm(role: string, key: keyof Omit<RolePermRow, "role">, value: boolean) {
    setRolePerms((prev) =>
      prev.map((r) => (r.role === role ? { ...r, [key]: value } : r))
    );
  }

  async function createRole() {
    const role = newRoleName.trim();
    if (!role) return;
    if (role.toLowerCase() === "admin") {
      showToast({ type: "error", message: "El rol admin ya existe" });
      return;
    }
    const defaults: RolePermRow = {
      role,
      can_dashboard: true,
      can_reservations: true,
      can_reservations_delete: false,
      can_menu: false,
      can_tables: true,
      can_tables_edit: false,
      can_customers: true,
      can_calendar: true,
      can_settings: false,
      can_staff: false,
      can_payments: false,
      can_table_checkin: true,
    };
    await saveRolePermissions(role, defaults);
    setNewRoleName("");
    setExpandedRoles((s) => {
      const next = new Set(s);
      next.add(role);
      return next;
    });
  }

  async function handleSavePermsForRole(role: string) {
    const row = rolePerms.find((r) => r.role === role);
    if (!row) return;
    await saveRolePermissions(role, row);
  }

  async function handleDeleteRole(role: string) {
    setSavingPerms(true);
    try {
      const res = await fetchWithAuth(
        `/api/dashboard/role-permissions?role=${encodeURIComponent(role)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", message: data.error ?? "Error al eliminar" });
        return;
      }
      showToast({ type: "success", message: "Rol eliminado" });
      setDeleteRoleName(null);
      void loadRolePermissions();
      void loadStaff();
    } catch {
      showToast({ type: "error", message: "Error del servidor" });
    } finally {
      setSavingPerms(false);
    }
  }

  async function loadStaff() {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/dashboard/staff");
      const data = await res.json();
      if (res.ok && Array.isArray(data.staff)) {
        setList(data.staff);
      }
    } catch {
      showToast({ type: "error", message: "Error al cargar el personal" });
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setCreateForm({ name: "", email: "", password: "", role: "staff" });
    setCreateModalOpen(true);
  }

  function openEditModal(row: StaffRow) {
    setSelected(row);
    setEditForm({
      name: row.name ?? "",
      email: row.email ?? "",
      password: "",
      role: row.role,
    });
    setEditModalOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/dashboard/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          password: createForm.password,
          role: createForm.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", message: data.error ?? "Error al crear" });
        return;
      }
      showToast({ type: "success", message: "Empleado creado" });
      setCreateModalOpen(false);
      void loadStaff();
    } catch {
      showToast({ type: "error", message: "Error del servidor" });
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/dashboard/staff/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          password: editForm.password || undefined,
          role: editForm.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", message: data.error ?? "Error al actualizar" });
        return;
      }
      showToast({ type: "success", message: "Empleado actualizado" });
      setEditModalOpen(false);
      setSelected(null);
      void loadStaff();
    } catch {
      showToast({ type: "error", message: "Error del servidor" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/dashboard/staff/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", message: data.error ?? "Error al eliminar" });
        return;
      }
      showToast({ type: "success", message: "Empleado eliminado" });
      setDeleteId(null);
      void loadStaff();
    } catch {
      showToast({ type: "error", message: "Error del servidor" });
    } finally {
      setSaving(false);
    }
  }

  function toggleExpand(role: string) {
    setExpandedRoles((s) => {
      const next = new Set(s);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
    );
  }, [list, search]);

  const availableRoles = useMemo(
    () =>
      [
        "staff",
        "manager",
        ...rolePerms
          .map((r) => r.role)
          .filter((r) => r !== "admin" && r !== "staff" && r !== "manager"),
      ],
    [rolePerms]
  );

  return (
    <div className="space-y-4 pb-24 sm:pb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-xalisco-cream sm:text-xl">
            Gestión de staff
          </h2>
          <p className="mt-1 text-xs text-xalisco-cream/60">
            Solo administradores pueden ver y gestionar empleados.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="hidden items-center gap-1.5 self-start rounded-lg bg-xalisco-burnt-orange px-3 py-2 text-xs font-semibold text-xalisco-black shadow-lg shadow-xalisco-burnt-orange/30 hover:bg-xalisco-burnt-orange-hover sm:inline-flex sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          Añadir empleado
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-xalisco-cream/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar empleado…"
          className="w-full rounded-lg border border-white/[0.12] bg-black/25 pl-9 pr-3 py-2 text-xs text-xalisco-cream placeholder:text-xalisco-cream/40 outline-none transition focus:border-xalisco-gold-bright/70"
        />
      </div>

      {/* Lista de empleados */}
      {loading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-6 text-center text-xs text-xalisco-cream/60">
          Cargando personal…
        </div>
      ) : filteredList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.1] bg-xalisco-black-soft/30 p-8 text-center">
          <UserCog className="mx-auto h-8 w-8 text-xalisco-cream/40" />
          <p className="mt-2 text-sm font-medium text-xalisco-cream">
            {search ? "Sin resultados" : "No hay empleados"}
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((row) => (
            <li
              key={row.id}
              className="overflow-hidden rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-3 transition hover:border-xalisco-gold/30"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-xalisco-burnt-orange/35 to-xalisco-gold/15 text-sm font-bold text-xalisco-cream">
                  {initialsOf(row.name, row.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-xalisco-cream">
                    {row.name ?? "Sin nombre"}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 truncate text-[11px] text-xalisco-cream/60">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{row.email ?? "—"}</span>
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleTone(row.role)}`}
                  >
                    <Shield className="h-3 w-3" />
                    {roleLabel(row.role)}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => openEditModal(row)}
                  className="inline-flex items-center gap-1 rounded-md border border-white/[0.12] px-2 py-1 text-[10px] text-xalisco-cream/85 hover:border-xalisco-gold/50 hover:text-xalisco-gold-bright"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(row.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Permisos por rol */}
      <section className="rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-xalisco-gold/15 text-xalisco-gold-bright">
            <Shield className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-xalisco-cream">
              Permisos por rol
            </h3>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-xalisco-cream/60">
              Admin tiene acceso completo. Aquí puedes crear roles personalizados
              y ajustar qué ve cada uno.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="Ej. Jefe Sala, Caja, Marketing…"
            className="w-full flex-1 rounded-lg border border-white/[0.12] bg-black/25 px-3 py-2 text-xs text-xalisco-cream placeholder:text-xalisco-cream/40 outline-none transition focus:border-xalisco-gold-bright/70"
          />
          <button
            type="button"
            onClick={createRole}
            disabled={savingPerms || !newRoleName.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-xalisco-burnt-orange px-3 py-2 text-xs font-semibold text-xalisco-black hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            Crear rol
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {rolePerms.map((permRow) => {
            const role = permRow.role;
            const isOpen = expandedRoles.has(role);
            const activeCount = PERM_LABELS.filter((p) => permRow[p.key]).length;
            return (
              <div
                key={role}
                className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/25"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(role)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.03]"
                >
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleTone(role)}`}
                  >
                    <Shield className="h-3 w-3" />
                    {roleLabel(role)}
                  </span>
                  <span className="text-[11px] text-xalisco-cream/60">
                    {activeCount} / {PERM_LABELS.length} permisos
                  </span>
                  <span className="ml-auto text-xalisco-cream/60">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-white/[0.06] px-3 py-3">
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {PERM_LABELS.map(({ key, label }) => {
                        const on = !!permRow[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setPerm(role, key, !on)}
                            className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition ${
                              on
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                                : "border-white/[0.1] bg-black/20 text-xalisco-cream/65 hover:border-white/25"
                            }`}
                          >
                            <span className="truncate">{label}</span>
                            <span
                              className={`relative h-4 w-7 shrink-0 rounded-full transition ${
                                on ? "bg-emerald-400/70" : "bg-white/15"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition ${
                                  on ? "left-[14px]" : "left-0.5"
                                }`}
                              />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setDeleteRoleName(role)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar rol
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSavePermsForRole(role)}
                        disabled={savingPerms}
                        className="inline-flex items-center gap-1.5 rounded-md bg-xalisco-burnt-orange px-3 py-1.5 text-[11px] font-semibold text-xalisco-black hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
                      >
                        <Save className="h-3 w-3" />
                        {savingPerms ? "Guardando…" : "Guardar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FAB móvil */}
      <button
        type="button"
        onClick={openCreateModal}
        className="fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-xalisco-burnt-orange text-xalisco-black shadow-2xl shadow-xalisco-burnt-orange/40 transition hover:bg-xalisco-burnt-orange-hover active:scale-95 sm:hidden"
        aria-label="Añadir empleado"
      >
        <UserPlus className="h-6 w-6" />
      </button>

      {/* Modal crear */}
      <DashboardModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Nuevo empleado"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] text-xalisco-cream/75">
              Nombre
            </label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, name: e.target.value }))
              }
              required
              className="w-full rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-xalisco-cream/75">
              Email
            </label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, email: e.target.value }))
              }
              required
              className="w-full rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-xalisco-cream/75">
              Contraseña (mín. 6 caracteres)
            </label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, password: e.target.value }))
              }
              required
              minLength={6}
              className="w-full rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-xalisco-cream/75">
              Rol
            </label>
            <select
              value={createForm.role}
              onChange={(e) =>
                setCreateForm((f) => ({
                  ...f,
                  role: e.target.value as StaffRole,
                }))
              }
              className="w-full rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="rounded-lg border border-white/[0.14] px-3 py-2 text-xs text-xalisco-cream/80 hover:border-white/30"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-xalisco-burnt-orange px-3 py-2 text-xs font-semibold text-xalisco-black hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Crear"}
            </button>
          </div>
        </form>
      </DashboardModal>

      {/* Modal editar */}
      <DashboardModal
        open={editModalOpen && !!selected}
        onClose={() => {
          setEditModalOpen(false);
          setSelected(null);
        }}
        title="Editar empleado"
        size="md"
      >
        {selected && (
          <form onSubmit={handleEdit} className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] text-xalisco-cream/75">
                Nombre
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                className="w-full rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-xalisco-cream/75">
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
                required
                className="w-full rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-xalisco-cream/75">
                Nueva contraseña (opcional)
              </label>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, password: e.target.value }))
                }
                minLength={6}
                placeholder="Dejar en blanco para no cambiar"
                className="w-full rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream placeholder:text-xalisco-cream/40 outline-none focus:border-xalisco-gold-bright/70"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-xalisco-cream/75">
                Rol
              </label>
              <select
                value={editForm.role}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    role: e.target.value as StaffRole,
                  }))
                }
                className="w-full rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelected(null);
                }}
                className="rounded-lg border border-white/[0.14] px-3 py-2 text-xs text-xalisco-cream/80 hover:border-white/30"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-xalisco-burnt-orange px-3 py-2 text-xs font-semibold text-xalisco-black hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        )}
      </DashboardModal>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="¿Eliminar empleado?"
        message="Esta acción no se puede deshacer. El empleado dejará de tener acceso al panel."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={saving}
      />

      <ConfirmModal
        open={deleteRoleName !== null}
        onClose={() => setDeleteRoleName(null)}
        onConfirm={() => deleteRoleName && handleDeleteRole(deleteRoleName)}
        title="¿Eliminar rol?"
        message="Los empleados con este rol pasarán a Staff."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        loading={savingPerms}
      />
    </div>
  );
}
