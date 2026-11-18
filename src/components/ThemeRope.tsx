"use client";

import { useEffect, useSyncExternalStore } from "react";
import { applyTheme, DEFAULT_THEME, readTheme, subscribeTheme, syncThemeColor, type Theme } from "@/lib/theme";
import { inkTransition, prepareInk } from "@/lib/ink-transition";
import { ropeSound } from "@/lib/rope-sound";

const HINT_KEY = "rope-hint";
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/* Physics engine: plain mutable state + rAF. Never touches React.     */
/* There is only one rope on the page, so it is a module singleton.    */
/* ------------------------------------------------------------------ */

const s = {
  pull: 0, // px the cord is stretched
  vp: 0, // pull velocity
  swing: 0, // deg
  vs: 0, // swing velocity
  aim: 0, // swing target while dragging
  dragging: false,
  raf: 0,
  startX: 0,
  startY: 0,
  reach: 0, // handle centre's distance from the top of the viewport
  moved: 0,
  lastCreak: 0,
};
let ropeEl: HTMLDivElement | null = null;
let handleEl: HTMLButtonElement | null = null;

function frame() {
  if (!s.dragging) {
    s.vp += -0.18 * s.pull - 0.16 * s.vp;
    s.pull += s.vp;
  }
  if (s.dragging) s.vs += -0.22 * (s.swing - s.aim) - 0.38 * s.vs;
  else s.vs += -0.05 * s.swing - 0.06 * s.vs;
  s.swing += s.vs;

  const settled =
    !s.dragging &&
    Math.abs(s.pull) < 0.05 &&
    Math.abs(s.vp) < 0.05 &&
    Math.abs(s.swing) < 0.05 &&
    Math.abs(s.vs) < 0.05;
  if (settled) s.pull = s.vp = s.swing = s.vs = 0;

  if (ropeEl) {
    ropeEl.style.setProperty("--pull", `${Math.max(-24, s.pull).toFixed(2)}px`);
    ropeEl.style.transform = `rotate(${s.swing.toFixed(3)}deg)`;
  }
  s.raf = settled ? 0 : requestAnimationFrame(frame);
}

function kick() {
  if (!s.raf) s.raf = requestAnimationFrame(frame);
}

function handleCentre() {
  const r = handleEl?.getBoundingClientRect();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth - 40, y: 120 };
}

function switchTheme() {
  const next: Theme = readTheme() === "dark" ? "light" : "dark";
  const { x, y } = handleCentre();
  ropeSound.splash(next);
  inkTransition(() => applyTheme(next), x, y);
}

function swingKick() {
  s.vs += Math.abs(s.swing) > 3 ? -Math.sign(s.swing) * 2 : (Math.random() < 0.5 ? -1 : 1) * 3.5;
}

/* ---------- pointer ---------- */

/*
 * The drag is tracked on window, not on the handle. Pointer capture alone is not
 * reliable everywhere (Safari can drop it, and a release outside the window or a
 * lost focus may never reach the handle), which used to leave the rope "stuck"
 * in drag mode. Window listeners + blur guarantee every drag ends.
 */

// How far the cord stretches. Follows the pointer ~1:1 at first, then resists,
// topping out at STRETCH px so it never feels like it stopped following.
const STRETCH = 120;
let dragPointer = -1;

function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
  if (e.button !== 0 || s.dragging) return;
  e.preventDefault();
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {
    /* not essential: window listeners below track the drag */
  }
  const r = e.currentTarget.getBoundingClientRect();
  s.dragging = true;
  dragPointer = e.pointerId;
  s.startX = e.clientX;
  s.startY = e.clientY;
  s.reach = r.top + r.height / 2;
  s.moved = 0;
  s.vp = 0;
  s.lastCreak = 0;
  ropeEl?.setAttribute("data-dragging", "");
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragUp);
  window.addEventListener("pointercancel", onDragCancel);
  window.addEventListener("blur", onDragCancel);
  ropeSound.grab();
  kick();
}

function onDragMove(e: PointerEvent) {
  if (!s.dragging || e.pointerId !== dragPointer) return;
  const dx = e.clientX - s.startX;
  const rawDy = e.clientY - s.startY;
  s.pull = STRETCH * Math.tanh(Math.max(0, rawDy) / STRETCH); // resists as it stretches
  const deg = (-Math.atan2(dx, s.reach + s.pull) * 180) / Math.PI; // follow the finger sideways
  s.aim = 32 * Math.tanh(deg / 32);
  s.moved = Math.max(s.moved, Math.hypot(dx, rawDy));
  if (Math.abs(s.pull - s.lastCreak) >= 6) {
    ropeSound.creak(s.pull);
    s.lastCreak = s.pull;
  }
  kick();
}

function onDragUp(e: PointerEvent) {
  if (e.pointerId === dragPointer) release(false);
}

function onDragCancel(e: Event) {
  if (e.type === "blur" || (e as PointerEvent).pointerId === dragPointer) release(true);
}

function release(cancelled: boolean) {
  if (!s.dragging) return;
  s.dragging = false;
  s.aim = 0;
  dragPointer = -1;
  ropeEl?.removeAttribute("data-dragging");
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragUp);
  window.removeEventListener("pointercancel", onDragCancel);
  window.removeEventListener("blur", onDragCancel);

  const tap = s.moved < 4;
  if (tap) s.vp = 9; // a tap still looks like a tug
  // A cancelled gesture (the OS took over) only springs back; it never switches.
  if (!cancelled && (tap || s.pull > 26)) {
    swingKick();
    ropeSound.snap();
    switchTheme();
  } else {
    ropeSound.letGo();
  }
  kick();
}

/** Keyboard (Enter / Space) and assistive tech arrive as a click with detail 0. */
function onClick(e: React.MouseEvent<HTMLButtonElement>) {
  if (e.detail !== 0) return; // pointer clicks were already handled on pointerup
  s.vp = 9;
  swingKick();
  switchTheme();
  kick();
}

function onPointerEnter(e: React.PointerEvent<HTMLButtonElement>) {
  if (e.pointerType !== "mouse" || s.dragging || reducedMotion()) return;
  s.vs += 1.6;
  ropeSound.swing();
  kick();
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * A pull-cord theme switch hanging from the top-right of the screen.
 * React renders once per theme change (for the aria-label). All motion is in the
 * engine above.
 */
export function ThemeRope() {
  const theme = useSyncExternalStore<Theme>(subscribeTheme, readTheme, () => DEFAULT_THEME);

  useEffect(() => {
    syncThemeColor();
    const reduce = reducedMotion();
    const timers: number[] = [];

    // Pre-build the ink field so the first pull starts instantly.
    const warm = () => {
      const { x, y } = handleCentre();
      prepareInk(x, y);
    };
    timers.push(window.setTimeout(warm, 300));
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(warm, 250);
    };
    window.addEventListener("resize", onResize);

    // Scroll momentum: the cord sways and bobs as the page moves.
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (s.dragging) return;
      s.vs = clamp(s.vs + clamp(dy * 0.035, -1.2, 1.2), -3, 3);
      s.vp = clamp(s.vp + Math.min(Math.abs(dy) * 0.03, 1), -3, 3);
      kick();
    };
    if (!reduce) window.addEventListener("scroll", onScroll, { passive: true });

    // First visit on a touch device: one hint swing so people notice the cord.
    if (!reduce && window.matchMedia("(hover: none)").matches) {
      let seen = true;
      try {
        seen = localStorage.getItem(HINT_KEY) === "1";
      } catch {
        /* storage blocked: skip the hint */
      }
      if (!seen) {
        timers.push(
          window.setTimeout(() => {
            s.vs += 4.5;
            s.vp = 6;
            kick();
            try {
              localStorage.setItem(HINT_KEY, "1");
            } catch {
              /* ignore */
            }
          }, 1800)
        );
      }
    }

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      release(true);
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, []);

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <div
      ref={(el) => {
        ropeEl = el;
      }}
      className="rope"
    >
      <div className="rope-cord" aria-hidden />
      <button
        ref={(el) => {
          handleEl = el;
        }}
        type="button"
        className="rope-handle"
        aria-label={label}
        title={label}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onClick={onClick}
      />
    </div>
  );
}
