"use client";

/**
 * /dashboard/content — CMS ligero: edita las secciones editables de la web
 * pública (hero, manifesto, stats, CTA, location, footer, contacto, el local).
 *
 * Cada sección tiene un schema declarativo (abajo) que genera inputs tipados:
 * text / textarea / image / list(string) / list(pillar) / list(stat) / list(galleryItem).
 * El contenido se guarda como JSON en site_content.content por section_key.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuthProvider";
import {
  SITE_CONTENT_DEFAULTS,
  SITE_SECTION_KEYS,
  type SiteContentMap,
  type SiteSectionKey,
  type StoryPillar,
  type StoryStat,
  type RooftopGalleryItem,
} from "@/lib/site-content";

type FieldType =
  | "text"
  | "textarea"
  | "image"
  | "url"
  | "list-string"
  | "list-pillar"
  | "list-stat"
  | "list-gallery";

type FieldSpec = {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  rows?: number;
};

type SectionSpec = {
  key: SiteSectionKey;
  title: string;
  description: string;
  fields: FieldSpec[];
};

const SECTIONS: SectionSpec[] = [
  {
    key: "global",
    title: "Global · Marca",
    description: "Datos generales de la marca (usados en varios sitios).",
    fields: [
      { key: "brand_name", label: "Nombre de la marca", type: "text" },
      { key: "tagline", label: "Tagline / claim", type: "text" },
      { key: "location_short", label: "Ubicación corta", type: "text" },
    ],
  },
  {
    key: "home.hero",
    title: "Home · Hero",
    description: "La primera pantalla de la home. Textos, imágenes y CTAs.",
    fields: [
      { key: "title_line_1", label: "Título línea 1", type: "text" },
      { key: "title_line_2", label: "Título línea 2 (cursiva)", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "textarea", rows: 3 },
      { key: "eyebrow_tagline", label: "Tagline superior (palabras sueltas)", type: "list-string" },
      { key: "open_today_label", label: "Etiqueta chip 1 (ej. Abierto hoy)", type: "text" },
      { key: "rating_label", label: "Etiqueta chip 2 (ej. 4.8 ★ / 200+)", type: "text" },
      { key: "sticker_line_1", label: "Sticker línea 1", type: "text" },
      { key: "sticker_line_2", label: "Sticker línea 2", type: "text" },
      { key: "cta_primary_label", label: "CTA primario (texto)", type: "text" },
      { key: "cta_primary_href", label: "CTA primario (link)", type: "url" },
      { key: "cta_secondary_label", label: "CTA secundario (texto)", type: "text" },
      { key: "cta_secondary_href", label: "CTA secundario (link)", type: "url" },
      { key: "image_main_url", label: "Imagen de fondo", type: "image" },
      { key: "image_floating_url", label: "Imagen flotante / mobile", type: "image" },
    ],
  },
  {
    key: "home.story",
    title: "Home · Manifesto & Stats",
    description: "Sección editorial con pilares, stats y marquee.",
    fields: [
      { key: "eyebrow", label: "Eyebrow (ej. Manifesto)", type: "text" },
      { key: "title", label: "Título", type: "text" },
      { key: "quote", label: "Cita / manifesto", type: "textarea", rows: 4 },
      { key: "pillars", label: "Pilares (4 bloques)", type: "list-pillar" },
      { key: "stats", label: "Stats (tarjetas con contador)", type: "list-stat" },
      { key: "marquee_words", label: "Palabras del marquee", type: "list-string" },
    ],
  },
  {
    key: "home.reserve_cta",
    title: "Home · CTA Reservas",
    description: "Banner grande que invita a reservar.",
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title_line_1", label: "Título línea 1", type: "text" },
      { key: "title_line_2", label: "Título línea 2 (cursiva)", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "textarea", rows: 3 },
      { key: "cta_label", label: "CTA texto", type: "text" },
      { key: "cta_href", label: "CTA link", type: "url" },
      { key: "image_url", label: "Imagen de fondo", type: "image" },
    ],
  },
  {
    key: "home.location",
    title: "Home · Localización",
    description: "Dirección, teléfono y horarios que aparecen en la web.",
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Título", type: "text" },
      { key: "address", label: "Dirección (calle)", type: "text" },
      { key: "city", label: "Ciudad / código postal", type: "text" },
      { key: "phone", label: "Teléfono", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "hours_weekdays", label: "Horario entre semana", type: "text" },
      { key: "hours_weekend", label: "Horario fin de semana", type: "text" },
      { key: "map_query", label: "Búsqueda para Google Maps", type: "text", help: "Ej: 'Almonte, Huelva'" },
    ],
  },
  {
    key: "footer",
    title: "Footer",
    description: "Textos y redes del pie de página.",
    fields: [
      { key: "marquee_words", label: "Palabras del marquee", type: "list-string" },
      { key: "big_logo", label: "Logo gigante (texto)", type: "text" },
      { key: "copyright", label: "Copyright", type: "text" },
      { key: "social_instagram", label: "Instagram (URL)", type: "url" },
      { key: "social_facebook", label: "Facebook (URL)", type: "url" },
      { key: "social_tiktok", label: "TikTok (URL)", type: "url" },
    ],
  },
  {
    key: "contacto",
    title: "Página · Contacto",
    description: "Hero y datos visibles en /contacto.",
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title_line_1", label: "Título línea 1", type: "text" },
      { key: "title_line_2", label: "Título línea 2 (cursiva)", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "textarea", rows: 3 },
      { key: "phone", label: "Teléfono", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "whatsapp", label: "WhatsApp", type: "text" },
      { key: "address", label: "Dirección completa", type: "text" },
    ],
  },
  {
    key: "rooftop",
    title: "Página · El local",
    description: "Galería editorial en /rooftop.",
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title_line_1", label: "Título línea 1", type: "text" },
      { key: "title_line_2", label: "Título línea 2 (cursiva)", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "textarea", rows: 3 },
      { key: "gallery", label: "Galería de fotos", type: "list-gallery" },
    ],
  },
];

type DirtyMap = Partial<Record<SiteSectionKey, boolean>>;
type OpenMap = Partial<Record<SiteSectionKey, boolean>>;

export default function DashboardContentPage() {
  const { fetchWithAuth } = useDashboardAuth();
  const { showToast } = useToast();
  const [content, setContent] = useState<SiteContentMap>(SITE_CONTENT_DEFAULTS);
  const [dirty, setDirty] = useState<DirtyMap>({});
  const [saving, setSaving] = useState<Partial<Record<SiteSectionKey, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<OpenMap>({ "home.hero": true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/dashboard/site-content");
      if (res.ok) {
        const data = await res.json();
        if (data?.content) {
          setContent(data.content as SiteContentMap);
        }
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

  const setField = useCallback(
    <K extends SiteSectionKey>(section: K, key: string, value: unknown) => {
      setContent((prev) => ({
        ...prev,
        [section]: {
          ...(prev[section] as Record<string, unknown>),
          [key]: value,
        } as SiteContentMap[K],
      }));
      setDirty((d) => ({ ...d, [section]: true }));
    },
    []
  );

  async function saveSection(section: SiteSectionKey) {
    setSaving((s) => ({ ...s, [section]: true }));
    try {
      const res = await fetchWithAuth("/api/dashboard/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_key: section,
          content: content[section],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", message: data.error ?? "No se pudo guardar" });
      } else {
        showToast({ type: "success", message: "Sección guardada" });
        setDirty((d) => ({ ...d, [section]: false }));
      }
    } catch {
      showToast({ type: "error", message: "Error de red al guardar" });
    } finally {
      setSaving((s) => ({ ...s, [section]: false }));
    }
  }

  async function resetSection(section: SiteSectionKey) {
    if (
      !window.confirm(
        "¿Restablecer esta sección a los valores por defecto? Se borrarán tus cambios guardados."
      )
    ) {
      return;
    }
    setSaving((s) => ({ ...s, [section]: true }));
    try {
      const res = await fetchWithAuth(
        `/api/dashboard/site-content?section_key=${section}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast({ type: "error", message: data.error ?? "No se pudo restablecer" });
      } else {
        showToast({ type: "success", message: "Sección restablecida" });
        setContent((prev) => ({
          ...prev,
          [section]: SITE_CONTENT_DEFAULTS[section],
        }));
        setDirty((d) => ({ ...d, [section]: false }));
      }
    } catch {
      showToast({ type: "error", message: "Error de red" });
    } finally {
      setSaving((s) => ({ ...s, [section]: false }));
    }
  }

  const dirtyCount = useMemo(
    () => Object.values(dirty).filter(Boolean).length,
    [dirty]
  );

  return (
    <div className="space-y-4 pb-24 sm:pb-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-xalisco-cream sm:text-xl">
            Contenido de la web
          </h2>
          <p className="mt-1 text-xs text-xalisco-cream/60">
            Edita los textos, imágenes y datos que se muestran en la web pública.
            Los cambios afectan al sitio en vivo tras guardar.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-xalisco-cream/50">
          <LayoutTemplate className="h-4 w-4" />
          {dirtyCount > 0 ? (
            <span className="text-xalisco-gold-bright">
              {dirtyCount} sección{dirtyCount === 1 ? "" : "es"} sin guardar
            </span>
          ) : (
            <span>Todo guardado</span>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-8 text-sm text-xalisco-cream/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando contenido…
        </div>
      ) : (
        <div className="space-y-3">
          {SECTIONS.map((spec) => (
            <SectionCard
              key={spec.key}
              spec={spec}
              value={content[spec.key]}
              dirty={!!dirty[spec.key]}
              saving={!!saving[spec.key]}
              open={!!open[spec.key]}
              onToggle={() =>
                setOpen((o) => ({ ...o, [spec.key]: !o[spec.key] }))
              }
              onField={(key, value) => setField(spec.key, key, value)}
              onSave={() => void saveSection(spec.key)}
              onReset={() => void resetSection(spec.key)}
            />
          ))}
        </div>
      )}

      {/* Aviso que no está en SECTIONS */}
      {SITE_SECTION_KEYS.length !== SECTIONS.length && (
        <p className="rounded-xl border border-white/[0.05] bg-xalisco-black-soft/40 p-3 text-[11px] text-xalisco-cream/50">
          Hay secciones adicionales en el sistema. Para editarlas necesitarás
          añadir su configuración a esta página.
        </p>
      )}
    </div>
  );
}

function SectionCard({
  spec,
  value,
  dirty,
  saving,
  open,
  onToggle,
  onField,
  onSave,
  onReset,
}: {
  spec: SectionSpec;
  value: unknown;
  dirty: boolean;
  saving: boolean;
  open: boolean;
  onToggle: () => void;
  onField: (key: string, value: unknown) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const data = (value ?? {}) as Record<string, unknown>;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 border-b border-white/[0.06] bg-gradient-to-r from-white/[0.03] to-transparent p-3 text-left transition hover:bg-white/[0.02]"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-xalisco-gold/15 text-xalisco-gold-bright">
          <LayoutTemplate className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-xalisco-cream">
            {spec.title}
            {dirty && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-xalisco-gold-bright" />
            )}
          </h3>
          <p className="truncate text-[11px] text-xalisco-cream/55">
            {spec.description}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-xalisco-cream/60 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="space-y-4 p-4">
          {spec.fields.map((f) => (
            <FieldRenderer
              key={f.key}
              field={f}
              value={data[f.key]}
              onChange={(v) => onField(f.key, v)}
            />
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={onReset}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-black/25 px-3 py-2 text-xs font-medium text-xalisco-cream/80 transition hover:border-white/[0.2] hover:text-xalisco-cream disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-1.5 rounded-lg bg-xalisco-burnt-orange px-4 py-2 text-xs font-semibold text-xalisco-black shadow-lg shadow-xalisco-burnt-orange/30 transition hover:bg-xalisco-burnt-orange-hover disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saving ? "Guardando…" : dirty ? "Guardar sección" : "Guardado"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = (
    <label className="flex flex-col gap-0.5 text-[11px] font-medium text-xalisco-cream/80">
      {field.label}
      {field.help && (
        <span className="text-[10.5px] font-normal text-xalisco-cream/50">
          {field.help}
        </span>
      )}
    </label>
  );

  if (field.type === "textarea") {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows ?? 3}
          className="min-h-[80px] resize-y rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm leading-relaxed text-xalisco-cream outline-none transition focus:border-xalisco-gold-bright/70"
        />
      </div>
    );
  }

  if (field.type === "image") {
    return <ImageField label={field.label} value={String(value ?? "")} onChange={onChange} />;
  }

  if (field.type === "list-string") {
    return (
      <ListStringField
        label={field.label}
        value={Array.isArray(value) ? (value as string[]) : []}
        onChange={onChange}
      />
    );
  }

  if (field.type === "list-pillar") {
    return (
      <ListPillarField
        label={field.label}
        value={Array.isArray(value) ? (value as StoryPillar[]) : []}
        onChange={onChange}
      />
    );
  }

  if (field.type === "list-stat") {
    return (
      <ListStatField
        label={field.label}
        value={Array.isArray(value) ? (value as StoryStat[]) : []}
        onChange={onChange}
      />
    );
  }

  if (field.type === "list-gallery") {
    return (
      <ListGalleryField
        label={field.label}
        value={Array.isArray(value) ? (value as RooftopGalleryItem[]) : []}
        onChange={onChange}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {label}
      <input
        type={field.type === "url" ? "text" : "text"}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.type === "url" ? "https://… o /ruta" : ""}
        className="rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none transition focus:border-xalisco-gold-bright/70"
      />
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-xalisco-cream/80">
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-white/[0.12] bg-black/30">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-xalisco-cream/40">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/hero.jpg o https://..."
            className="rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none transition focus:border-xalisco-gold-bright/70"
          />
          <p className="text-[10.5px] text-xalisco-cream/50">
            Usa rutas públicas (ej. <code>/hero.jpg</code>) o URLs externas.
          </p>
        </div>
      </div>
    </div>
  );
}

function ListStringField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-medium text-xalisco-cream/80">
        {label}
      </label>
      <div className="space-y-1.5">
        {value.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none transition focus:border-xalisco-gold-bright/70"
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.1] text-xalisco-cream/60 transition hover:border-red-400/50 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="inline-flex w-fit items-center gap-1 rounded-lg border border-dashed border-white/[0.18] bg-black/20 px-3 py-1.5 text-[11px] font-medium text-xalisco-cream/80 transition hover:border-xalisco-gold-bright/50 hover:text-xalisco-gold-bright"
      >
        <Plus className="h-3.5 w-3.5" /> Añadir
      </button>
    </div>
  );
}

function ListPillarField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: StoryPillar[];
  onChange: (v: StoryPillar[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-medium text-xalisco-cream/80">
        {label}
      </label>
      <div className="space-y-2">
        {value.map((p, i) => (
          <div
            key={i}
            className="space-y-2 rounded-lg border border-white/[0.08] bg-black/20 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-xalisco-cream/50">
                Pilar {i + 1}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="text-xalisco-cream/50 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={p.id}
                placeholder="01"
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...p, id: e.target.value };
                  onChange(next);
                }}
                className="rounded-lg border border-white/[0.14] bg-black/25 px-3 py-1.5 text-xs text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
              />
              <input
                type="text"
                value={p.title}
                placeholder="Título"
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...p, title: e.target.value };
                  onChange(next);
                }}
                className="rounded-lg border border-white/[0.14] bg-black/25 px-3 py-1.5 text-xs text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
              />
            </div>
            <textarea
              value={p.copy}
              rows={2}
              placeholder="Copy del pilar"
              onChange={(e) => {
                const next = [...value];
                next[i] = { ...p, copy: e.target.value };
                onChange(next);
              }}
              className="min-h-[50px] w-full resize-y rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-xs text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([
            ...value,
            { id: String(value.length + 1).padStart(2, "0"), title: "", copy: "" },
          ])
        }
        className="inline-flex w-fit items-center gap-1 rounded-lg border border-dashed border-white/[0.18] bg-black/20 px-3 py-1.5 text-[11px] font-medium text-xalisco-cream/80 transition hover:border-xalisco-gold-bright/50 hover:text-xalisco-gold-bright"
      >
        <Plus className="h-3.5 w-3.5" /> Añadir pilar
      </button>
    </div>
  );
}

function ListStatField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: StoryStat[];
  onChange: (v: StoryStat[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-medium text-xalisco-cream/80">
        {label}
      </label>
      <div className="space-y-2">
        {value.map((s, i) => (
          <div
            key={i}
            className="grid grid-cols-[70px_70px_1fr_auto] items-center gap-2 rounded-lg border border-white/[0.08] bg-black/20 p-2"
          >
            <input
              type="number"
              value={s.value}
              onChange={(e) => {
                const next = [...value];
                next[i] = { ...s, value: Number(e.target.value) || 0 };
                onChange(next);
              }}
              className="rounded-lg border border-white/[0.14] bg-black/25 px-2 py-1.5 text-xs text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
            />
            <input
              type="text"
              value={s.suffix}
              placeholder="+ / % / ★"
              onChange={(e) => {
                const next = [...value];
                next[i] = { ...s, suffix: e.target.value };
                onChange(next);
              }}
              className="rounded-lg border border-white/[0.14] bg-black/25 px-2 py-1.5 text-xs text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
            />
            <input
              type="text"
              value={s.label}
              placeholder="Etiqueta"
              onChange={(e) => {
                const next = [...value];
                next[i] = { ...s, label: e.target.value };
                onChange(next);
              }}
              className="rounded-lg border border-white/[0.14] bg-black/25 px-2 py-1.5 text-xs text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="text-xalisco-cream/50 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([...value, { value: 0, suffix: "", label: "" }])
        }
        className="inline-flex w-fit items-center gap-1 rounded-lg border border-dashed border-white/[0.18] bg-black/20 px-3 py-1.5 text-[11px] font-medium text-xalisco-cream/80 transition hover:border-xalisco-gold-bright/50 hover:text-xalisco-gold-bright"
      >
        <Plus className="h-3.5 w-3.5" /> Añadir stat
      </button>
    </div>
  );
}

function ListGalleryField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RooftopGalleryItem[];
  onChange: (v: RooftopGalleryItem[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-medium text-xalisco-cream/80">
        {label}
      </label>
      <div className="space-y-2">
        {value.map((g, i) => (
          <div
            key={i}
            className="space-y-2 rounded-lg border border-white/[0.08] bg-black/20 p-3"
          >
            <div className="flex items-start gap-3">
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-white/[0.12] bg-black/40">
                {g.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.src}
                    alt={g.title || ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xalisco-cream/40">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <input
                  type="text"
                  value={g.src}
                  placeholder="/local1.jpg"
                  onChange={(e) => {
                    const next = [...value];
                    next[i] = { ...g, src: e.target.value };
                    onChange(next);
                  }}
                  className="rounded-lg border border-white/[0.14] bg-black/25 px-2 py-1.5 text-xs text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
                />
                <input
                  type="text"
                  value={g.title}
                  placeholder="Título"
                  onChange={(e) => {
                    const next = [...value];
                    next[i] = { ...g, title: e.target.value };
                    onChange(next);
                  }}
                  className="rounded-lg border border-white/[0.14] bg-black/25 px-2 py-1.5 text-xs text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
                />
              </div>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="text-xalisco-cream/50 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-2">
              <input
                type="text"
                value={g.caption}
                placeholder="Subtítulo / descripción"
                onChange={(e) => {
                  const next = [...value];
                  next[i] = { ...g, caption: e.target.value };
                  onChange(next);
                }}
                className="rounded-lg border border-white/[0.14] bg-black/25 px-2 py-1.5 text-xs text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
              />
              <select
                value={g.span ?? "square"}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = {
                    ...g,
                    span: e.target.value as RooftopGalleryItem["span"],
                  };
                  onChange(next);
                }}
                className="rounded-lg border border-white/[0.14] bg-black/25 px-2 py-1.5 text-xs text-xalisco-cream outline-none focus:border-xalisco-gold-bright/70"
              >
                <option value="square">Cuadrada</option>
                <option value="tall">Vertical</option>
                <option value="wide">Ancha</option>
              </select>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([
            ...value,
            {
              id: value.length + 1,
              src: "",
              title: "",
              caption: "",
              span: "square",
            },
          ])
        }
        className="inline-flex w-fit items-center gap-1 rounded-lg border border-dashed border-white/[0.18] bg-black/20 px-3 py-1.5 text-[11px] font-medium text-xalisco-cream/80 transition hover:border-xalisco-gold-bright/50 hover:text-xalisco-gold-bright"
      >
        <Plus className="h-3.5 w-3.5" /> Añadir imagen
      </button>
    </div>
  );
}
