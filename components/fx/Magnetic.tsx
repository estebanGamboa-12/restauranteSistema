"use client";

/**
 * Magnetic: wrapper que atrae su contenido hacia el cursor cuando está cerca.
 * Pensado para botones/CTAs. Desactivado en pantallas táctiles y reducidas.
 */

import { useRef, type ReactNode } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type MagneticProps = {
  children: ReactNode;
  strength?: number; // 0..1
  className?: string;
};

export function Magnetic({ children, strength = 0.35, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const node = ref.current;
      if (!node || !contextSafe) return;
      if (window.matchMedia("(pointer: coarse)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const handleMove = contextSafe((e: MouseEvent) => {
        const rect = node.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        gsap.to(node, {
          x: relX * strength,
          y: relY * strength,
          duration: 0.6,
          ease: "power3.out",
        });
      });

      const handleLeave = contextSafe(() => {
        gsap.to(node, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
      });

      node.addEventListener("mousemove", handleMove);
      node.addEventListener("mouseleave", handleLeave);

      return () => {
        node.removeEventListener("mousemove", handleMove);
        node.removeEventListener("mouseleave", handleLeave);
      };
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={cn("inline-block will-change-transform", className)}>
      {children}
    </div>
  );
}
