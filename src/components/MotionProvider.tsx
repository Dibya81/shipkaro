"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/** Loads only the Motion features we use and honours prefers-reduced-motion site-wide. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
