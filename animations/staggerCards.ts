"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AnimationTarget, ScrollTriggerOptions } from "./types";
import { resolveTarget } from "./types";

export interface StaggerCardsOptions extends ScrollTriggerOptions {
  childSelector?: string;
  y?: number;
  opacity?: number;
  stagger?: number;
  ease?: string;
}

const DEFAULTS: StaggerCardsOptions = {
  start: "top 85%",
  end: "top 25%",
  scrub: 1,
  childSelector: "> *",
  y: 48,
  opacity: 0,
  stagger: 0.1,
  ease: "power2.out",
};

export function staggerCards(
  target: AnimationTarget,
  options: StaggerCardsOptions = {}
): () => void {
  if (typeof window === "undefined") return () => {};

  const el = resolveTarget(target);
  if (!el) return () => {};

  const opts = { ...DEFAULTS, ...options };
  const children = el.querySelectorAll(opts.childSelector ?? "> *");
  if (!children.length) return () => {};

  const ctx = gsap.context(() => {
    gsap.fromTo(
      children,
      {
        y: opts.y,
        opacity: opts.opacity,
      },
      {
        y: 0,
        opacity: 1,
        ease: opts.ease,
        stagger: opts.stagger,
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
