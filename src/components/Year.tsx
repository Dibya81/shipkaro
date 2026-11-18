"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Current year, read only in the browser (never during the static prerender),
 * so the footer can't show a stale year from build time.
 */
export function Year() {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => null
  );
  return <span>{year}</span>;
}
