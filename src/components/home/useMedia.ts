"use client";

import { useSyncExternalStore } from "react";

/** Subscribes to a media query. The server snapshot assumes desktop. */
export function useMedia(query: string, serverValue = true) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/**
 * Like motion's useReducedMotion, but hydration-safe: the first render matches
 * the server (motion on), then it switches if the visitor prefers reduced motion.
 */
export function useReducedMotion() {
  return useMedia("(prefers-reduced-motion: reduce)", false);
}
