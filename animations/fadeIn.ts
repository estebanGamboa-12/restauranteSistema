"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AnimationTarget, ScrollTriggerOptions } from "./types";
import { resolveTarget } from "./types";

export interface FadeInOptions extends ScrollTriggerOptions {
  opacity?: number;
  y?: number;
  scale?: number;
  ease?: string;
}

const DEFAULTS: FadeInOptions = {
  start: "top 90%",
  end: "top 50%",
  scrub: 1,
  opacity: 0,
  y: 24,
  scale: 1,
  ease: "power2.out",
};

export function fadeIn(
  target: AnimationTarget,
  options: FadeInOptions = {}
): () => void {
  if (typeof window === "undefined") return () => {};

  const el = resolveTarget(target);
  if (!el) return () => {};

  const opts = { ...DEFAULTS, ...options };

  const ctx = gsap.context(() => {
    gsap.fromTo(
      el,
      {
        opacity: opts.opacity,
        y: opts.y,
        scale: opts.scale,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: opts.ease,
        scrollTrigger: {
          trigger: el,
          start: opts.start,
          end: opts.end,
          scrub: opts.scrub,
        },
      }
    );
  });

  return () => ctx.revert();
}
