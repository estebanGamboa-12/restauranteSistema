/**
 * Shared Framer Motion config for subtle, premium micro-interactions.
 */

export const motionTransition = {
  duration: 0.25,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const motionSpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

export const hoverScale = 1.02;
export const hoverLift = -3;
export const imageTilt = { rotateX: -2, rotateY: 2 };
