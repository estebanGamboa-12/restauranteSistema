"use client";

/**
 * Reveal: wrapper sencillo que desliza + fadea el contenido cuando entra en
 * el viewport usando ScrollTrigger. Pensado para titulares, párrafos e imágenes.
 */

import { useRef, type ReactNode } from "react";
import { useGSAP, gsap } from "@/lib/gsap";

type RevealProps = {
  children: ReactNode;
  className?: string;
  y?: number;
  x?: number;
  delay?: number;
  duration?: number;
  ease?: string;
  start?: string;
  once?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
};

export function Reveal({
  children,
  className,
  y = 40,
  x = 0,
  delay = 0,
  duration = 0.9,
  ease = "power3.out",
  start = "top 85%",
  once = true,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const node = ref.current;
      if (!node) return;
      gsap.set(node, { y, x, opacity: 0 });
      const tween = gsap.to(node, {
        y: 0,
        x: 0,
        opacity: 1,
        duration,
        delay,
        ease,
        scrollTrigger: {
          trigger: node,
          start,
          toggleActions: once ? "play none none none" : "play none none reverse",
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: ref }
  );

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref as React.Ref<HTMLElement>} className={className}>
      {children}
    </Tag>
  );
}
