/**
 * Reusable GSAP + ScrollTrigger animation system.
 * All animations use scrub (no pinning) for cinematic scroll-tied effects.
 */

export { gsap, ScrollTrigger } from "@/lib/gsap";
export type { AnimationTarget, ScrollTriggerOptions } from "./types";

export { revealUp } from "./revealUp";
export type { RevealUpOptions } from "./revealUp";

export { parallaxImage } from "./parallaxImage";
export type { ParallaxImageOptions } from "./parallaxImage";

export { textReveal } from "./textReveal";
export type { TextRevealOptions } from "./textReveal";

export { fadeIn } from "./fadeIn";
export type { FadeInOptions } from "./fadeIn";

export { staggerCards } from "./staggerCards";
export type { StaggerCardsOptions } from "./staggerCards";
