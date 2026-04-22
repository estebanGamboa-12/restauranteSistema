"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AnimationTarget, ScrollTriggerOptions } from "./types";
import { resolveTarget } from "./types";

export interface ParallaxImageOptions extends ScrollTriggerOptions {
  speed?: number;
  start?: string;
  end?: string;
}

const DEFAULTS: ParallaxImageOptions = {
  start: "top bottom",
  end: "bottom top",
  scrub: 1,
  speed: 0.5,
};

export function parallaxImage(
  target: AnimationTarget,
  options: ParallaxImageOptions = {}
): () => void {
  if (typeof window === "undefined") return () => {};

  const el = resolveTarget(target);
  if (!el) return () => {};

  const opts = { ...DEFAULTS, ...options };

  const ctx = gsap.context(() => {
    gsap.to(el, {
      yPercent: -(opts.speed ?? 0.5) * 100,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: opts.start,
        end: opts.end,
        scrub: opts.scrub,
      },
    });
  });

  return () => ctx.revert();
}
