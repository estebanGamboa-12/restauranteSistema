"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AnimationTarget, ScrollTriggerOptions } from "./types";
import { resolveTarget } from "./types";

export interface TextRevealOptions extends ScrollTriggerOptions {
  y?: number;
  opacity?: number;
  clipPath?: boolean;
  ease?: string;
}

const DEFAULTS: TextRevealOptions = {
  start: "top 85%",
  end: "top 35%",
  scrub: 1,
  y: 40,
  opacity: 0,
  clipPath: true,
  ease: "power2.out",
};

export function textReveal(
  target: AnimationTarget,
  options: TextRevealOptions = {}
): () => void {
  if (typeof window === "undefined") return () => {};

  const el = resolveTarget(target);
  if (!el) return () => {};

  const opts = { ...DEFAULTS, ...options };

  const ctx = gsap.context(() => {
    const fromVars: gsap.TweenVars = {
      y: opts.y,
      opacity: opts.opacity,
    };
    if (opts.clipPath) {
      fromVars.clipPath = "inset(100% 0 0 0)";
    }

    const toVars: gsap.TweenVars = {
      y: 0,
      opacity: 1,
      ease: opts.ease,
      scrollTrigger: {
        trigger: el,
        start: opts.start,
        end: opts.end,
        scrub: opts.scrub,
      },
    };
    if (opts.clipPath) {
      toVars.clipPath = "inset(0% 0 0 0)";
    }

    gsap.fromTo(el, fromVars, toVars);
  });

  return () => ctx.revert();
}
