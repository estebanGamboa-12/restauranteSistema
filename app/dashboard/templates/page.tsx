"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuthProvider";
import {
  DEFAULT_MESSAGE_TEMPLATES,
  TEMPLATE_VARIABLES,
  type MessageTemplate,
} from "@/lib/message-templates";
import { MessageSquareText, Save, Hash, Copy } from "lucide-react";

export default function TemplatesPage() {
  const { fetchWithAuth } = useDashboardAuth();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>(
    DEFAULT_MESSAGE_TEMPLATES
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchWithAuth("/api/dashboard/message-templates");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.templates) && data.templates.length > 0) {
            const byKey = new Map(
              (data.templates as MessageTemplate[]).map((t) => [t.key, t])
            );
            setTemplates(
              DEFAULT_MESSAGE_TEMPLATES.map(
                (d) => byKey.get(d.key) ?? d
              ) as MessageTemplate[]
            );
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [fetchWithAuth]);

  function updateTemplate(index: number, patch: Partial<MessageTemplate>) {
    setTemplates((arr) =>
      arr.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/dashboard/message-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templates: templates.map((t) => ({
            key: t.key,
            title: t.title,
            body: t.body,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", message: data.error ?? "No se pudo guardar" });
      } else {
        showToast({ type: "success", message: "Plantillas guardadas" });
      }
    } catch {
      showToast({ type: "error", message: "No se pudo guardar" });
    } finally {
      setSaving(false);
    }
  }

  async function copyVar(name: string) {
    try {
      await navigator.clipboard.writeText(name);
      showToast({ type: "success", message: `Copiado: ${name}` });
    } catch {
      showToast({ type: "error", message: "No se pudo copiar" });
    }
  }

  return (
    <div className="space-y-4 pb-24 sm:pb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-xalisco-cream sm:text-xl">
            Plantillas de mensajes
          </h2>
          <p className="mt-1 text-xs text-xalisco-cream/60">
            Edita los textos que se usan al abrir WhatsApp con un cliente. No se
            envía nada automáticamente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || loading}
          className="hidden items-center gap-1.5 self-start rounded-lg bg-xalisco-burnt-orange px-3 py-2 text-xs font-semibold text-xalisco-black shadow-lg shadow-xalisco-burnt-orange/30 hover:bg-xalisco-burnt-orange-hover disabled:opacity-60 sm:inline-flex sm:self-auto"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar plantillas"}
        </button>
      </div>

      {/* Variables disponibles */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60">
        <div className="flex items-start gap-3 border-b border-white/[0.06] bg-gradient-to-r from-white/[0.03] to-transparent p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-xalisco-gold/15 text-xalisco-gold-bright">
            <Hash className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-xalisco-cream">
              Variables disponibles
            </h3>
            <p className="text-[11px] text-xalisco-cream/60">
              Toca una variable para copiarla y pégala dentro de un mensaje.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 p-3">
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.name}
              type="button"
              onClick={() => void copyVar(v.name)}
              title={v.description}
              className="group inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-black/30 px-2.5 py-1 text-[11px] text-xalisco-cream/85 transition hover:border-xalisco-gold/50 hover:text-xalisco-gold-bright"
            >
              <code className="font-mono text-xalisco-gold-bright">
                {v.name}
              </code>
              <Copy className="h-3 w-3 text-xalisco-cream/40 transition group-hover:text-xalisco-gold-bright" />
            </button>
          ))}
        </div>
      </section>

      {/* Plantillas */}
      {loading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-6 text-center text-xs text-xalisco-cream/60">
          Cargando plantillas…
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t, idx) => (
            <div
              key={t.key}
              className="overflow-hidden rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60"
            >
              <div className="flex items-center gap-2 border-b border-white/[0.06] bg-gradient-to-r from-white/[0.03] to-transparent px-4 py-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-xalisco-burnt-orange/15 text-xalisco-burnt-orange">
                  <MessageSquareText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-xalisco-cream">
                    {t.title || t.key}
                  </p>
                  <p className="inline-flex items-center gap-1 text-[10px] text-xalisco-cream/50">
                    <code className="font-mono text-xalisco-gold-bright/80">
                      {t.key}
                    </code>
                    {t.updated_at && (
                      <span>
                        · actualizada{" "}
                        {new Date(t.updated_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-2 p-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-xalisco-cream/80">
                    Título de la plantilla
                  </label>
                  <input
                    type="text"
                    value={t.title}
                    onChange={(e) =>
                      updateTemplate(idx, { title: e.target.value })
                    }
                    className="rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none transition focus:border-xalisco-gold-bright/70"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-xalisco-cream/80">
                    Mensaje
                  </label>
                  <textarea
                    value={t.body}
                    onChange={(e) =>
                      updateTemplate(idx, { body: e.target.value })
                    }
                    rows={5}
                    className="min-h-[120px] resize-y rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm leading-relaxed text-xalisco-cream outline-none transition focus:border-xalisco-gold-bright/70"
                  />
                  <p className="text-[10.5px] text-xalisco-cream/50">
                    Usa las variables de arriba para personalizar el mensaje.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sticky save móvil */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-white/[0.08] bg-xalisco-black/95 p-3 backdrop-blur-md sm:hidden">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || loading}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-xalisco-burnt-orange px-4 py-3 text-sm font-semibold text-xalisco-black shadow-lg shadow-xalisco-burnt-orange/30 hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar plantillas"}
        </button>
      </div>
    </div>
  );
}
