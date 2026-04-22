"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AnimationTarget, ScrollTriggerOptions } from "./types";
import { resolveTarget } from "./types";

export interface RevealUpOptions extends ScrollTriggerOptions {
  y?: number;
  opacity?: number;
  duration?: number;
  ease?: string;
}

const DEFAULTS: RevealUpOptions = {
  start: "top 85%",
  end: "top 20%",
  scrub: 1,
  y: 60,
  opacity: 0,
  ease: "power2.out",
};

export function revealUp(
  target: AnimationTarget,
  options: RevealUpOptions = {}
): () => void {
  if (typeof window === "undefined") return () => {};

  const el = resolveTarget(target);
  if (!el) return () => {};

  const opts = { ...DEFAULTS, ...options };

  const ctx = gsap.context(() => {
    gsap.fromTo(
      el,
      {
        y: opts.y,
        opacity: opts.opacity,
      },
      {
        y: 0,
        opacity: 1,
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
