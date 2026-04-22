/**
 * GSAP central registration.
 * Call registerScrollTrigger() once on the client (e.g. in SmoothScrollProvider).
 * We also register @gsap/react's useGSAP plugin so hooks can use scoping + auto-cleanup.
 * force3D: true promotes transforms to GPU for 60fps animations.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

let registered = false;

export function registerScrollTrigger(): void {
  if (typeof window === "undefined") return;
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  gsap.config({ force3D: true });
  registered = true;
}

export { gsap, ScrollTrigger, useGSAP };
