export type RefLike<T = HTMLElement> = { current: T | null };

export type AnimationTarget = Element | string | RefLike<HTMLElement>;

export interface ScrollTriggerOptions {
  start?: string;
  end?: string;
  scrub?: number | boolean;
  markers?: boolean;
}

export function resolveTarget(target: AnimationTarget): Element | null {
  if (typeof target === "string") {
    return document.querySelector(target);
  }
  if (target && typeof target === "object" && "current" in target) {
    return (target as RefLike).current;
  }
  return target instanceof Element ? target : null;
}
