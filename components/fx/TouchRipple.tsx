"use client";

/**
 * TouchRipple: en dispositivos táctiles, cuando el usuario toca un elemento con
 * `data-cursor`, dibuja un círculo expansivo desde el punto del tap. Imita el
 * feedback del cursor magnético desktop. Solo se monta en coarse-pointer.
 */

import { useEffect } from "react";
import { gsap } from "gsap";

export function TouchRipple() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onTouch = (e: TouchEvent) => {
      const target = (e.target as HTMLElement | null)?.closest(
        'a, button, [role="button"], [data-cursor]'
      ) as HTMLElement | null;
      if (!target) return;
      const touch = e.touches[0];
      if (!touch) return;

      const ripple = document.createElement("span");
      ripple.setAttribute("aria-hidden", "true");
      ripple.style.position = "fixed";
      ripple.style.left = `${touch.clientX}px`;
      ripple.style.top = `${touch.clientY}px`;
      ripple.style.width = "12px";
      ripple.style.height = "12px";
      ripple.style.borderRadius = "9999px";
      ripple.style.backgroundColor = "rgba(232,108,62,0.35)";
      ripple.style.border = "1px solid rgba(245,200,122,0.6)";
      ripple.style.transform = "translate(-50%,-50%) scale(1)";
      ripple.style.pointerEvents = "none";
      ripple.style.zIndex = "9998";
      ripple.style.mixBlendMode = "screen";
      document.body.appendChild(ripple);

      gsap.to(ripple, {
        scale: 16,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        onComplete: () => ripple.remove(),
      });
    };

    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => window.removeEventListener("touchstart", onTouch);
  }, []);

  return null;
}
