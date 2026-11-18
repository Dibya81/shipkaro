"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** The live Lenis instance, so components can scroll programmatically without fighting it. */
let lenis: Lenis | null = null;

/** Smoothly scroll to an absolute page offset (falls back to native scrolling). */
export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { duration: 1.1 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

/**
 * Inertial smooth scrolling (Lenis). It drives the native scroll position, so
 * Motion's useScroll and sticky positioning keep working untouched.
 * Skipped entirely for visitors who prefer reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    lenis = new Lenis({ autoRaf: true, lerp: 0.11, anchors: { offset: -96 } });
    return () => {
      lenis?.destroy();
      lenis = null;
    };
  }, []);
  return null;
}
