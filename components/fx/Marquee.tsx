"use client";

/**
 * Marquee infinito horizontal con GSAP.
 * Duplica el contenido para conseguir loop sin corte, y pausa en hover.
 */

import { useRef, type ReactNode } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type MarqueeProps = {
  children: ReactNode;
  speed?: number; // px / s
  direction?: "left" | "right";
  className?: string;
  pauseOnHover?: boolean;
};

export function Marquee({
  children,
  speed = 80,
  direction = "left",
  className,
  pauseOnHover = true,
}: MarqueeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const track = wrapper.querySelector<HTMLElement>("[data-marquee-track]");
      const first = wrapper.querySelector<HTMLElement>("[data-marquee-item]");
      if (!track || !first) return;

      const distance = first.offsetWidth;
      if (!distance) return;

      const duration = distance / speed;

      const tween = gsap.to(track, {
        x: direction === "left" ? -distance : distance,
        ease: "none",
        duration,
        repeat: -1,
      });

      if (pauseOnHover) {
        const onEnter = () => tween.timeScale(0.15);
        const onLeave = () => tween.timeScale(1);
        wrapper.addEventListener("mouseenter", onEnter);
        wrapper.addEventListener("mouseleave", onLeave);
        return () => {
          wrapper.removeEventListener("mouseenter", onEnter);
          wrapper.removeEventListener("mouseleave", onLeave);
          tween.kill();
        };
      }

      return () => tween.kill();
    },
    { scope: wrapperRef }
  );

  return (
    <div
      ref={wrapperRef}
      className={cn("relative w-full overflow-hidden", className)}
      aria-hidden
    >
      <div data-marquee-track className="flex w-max will-change-transform">
        <div data-marquee-item className="flex shrink-0">
          {children}
        </div>
        <div data-marquee-item className="flex shrink-0" aria-hidden>
          {children}
        </div>
        <div data-marquee-item className="flex shrink-0" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
