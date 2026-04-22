"use client";

/**
 * SplitText casero (sin el plugin premium de GSAP).
 * Divide un texto en palabras y letras para animarlas.
 * - `by="chars"`: anima letra por letra.
 * - `by="words"`: anima palabra por palabra.
 * Usa `useGSAP` para entrada al hacer scroll o al montar.
 */

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";

type SplitTextProps = {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  lineClassName?: string;
  by?: "chars" | "words";
  stagger?: number;
  delay?: number;
  duration?: number;
  y?: number;
  ease?: string;
  triggerOnScroll?: boolean;
  start?: string;
};

export function SplitText({
  text,
  as = "span",
  className,
  lineClassName,
  by = "chars",
  stagger = 0.025,
  delay = 0,
  duration = 0.9,
  y = 60,
  ease = "power4.out",
  triggerOnScroll = false,
  start = "top 85%",
}: SplitTextProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const items = root.querySelectorAll<HTMLElement>("[data-split-item]");
      if (!items.length) return;

      gsap.set(items, { yPercent: 110, opacity: 1 });

      const tween = gsap.to(items, {
        yPercent: 0,
        duration,
        stagger,
        delay,
        ease,
        ...(triggerOnScroll && {
          scrollTrigger: {
            trigger: root,
            start,
            toggleActions: "play none none reverse",
          },
        }),
      });
      // silence unused y var while keeping the prop in API
      void y;
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: rootRef, dependencies: [text] }
  );

  const words = text.split(/(\s+)/);

  const Tag = as as React.ElementType;

  return (
    <Tag ref={rootRef as React.Ref<HTMLElement>} className={className}>
      {words.map((word, wi) => {
        if (/^\s+$/.test(word)) {
          return <span key={`space-${wi}`}>{word}</span>;
        }
        return (
          <span
            key={`w-${wi}`}
            className={lineClassName}
            style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom" }}
          >
            <span
              data-split-item={by === "words" ? true : undefined}
              style={{ display: "inline-block" }}
            >
              {by === "chars"
                ? word.split("").map((c, ci) => (
                    <span
                      key={`c-${wi}-${ci}`}
                      data-split-item
                      style={{ display: "inline-block", willChange: "transform" }}
                    >
                      {c}
                    </span>
                  ))
                : word}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
