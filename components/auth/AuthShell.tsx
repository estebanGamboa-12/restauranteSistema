import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-xalisco-black px-4 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="font-display text-xs font-semibold tracking-widest text-xalisco-gold-bright/90"
          >
            PACO&apos;S FOOD
          </Link>
          <h1 className="mt-4 font-display text-3xl font-semibold text-xalisco-cream sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-xalisco-cream/70">{subtitle}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-xalisco-black-soft/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:p-8">
          {children}
        </div>
        {footer ? (
          <div className="mt-6 text-center text-xs text-xalisco-cream/70">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const authInputClass =
  "w-full rounded-lg border border-white/[0.12] bg-xalisco-black/60 px-4 py-3 text-sm text-xalisco-cream placeholder:text-xalisco-cream/40 outline-none transition focus:border-xalisco-gold/60 focus:ring-1 focus:ring-xalisco-gold/40";

export const authButtonClass =
  "w-full rounded-lg bg-xalisco-burnt-orange px-6 py-3 text-sm font-semibold text-xalisco-black transition-colors hover:bg-xalisco-burnt-orange-hover disabled:opacity-60";

export const authLabelClass =
  "mb-1.5 block text-xs font-medium text-xalisco-cream/80";
