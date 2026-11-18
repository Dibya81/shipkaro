"use client";

import { useRef } from "react";
import { useAnimationFrame, useInView, useReducedMotion, useScroll } from "motion/react";
import { useMedia } from "@/components/home/useMedia";

/**
 * The client requests that drift along curved lines around the hero.
 * Story: what people ask us for, flowing past what we promise.
 * Each textPath's startOffset is advanced by time plus scroll position, written
 * straight to the DOM (never React state). Paused off-screen, static under reduced motion.
 */
export function HeroDrift({ lines }: { lines: string[] }) {
  const root = useRef<SVGSVGElement>(null);
  const loopText = useRef<SVGTextPathElement>(null);
  const ribbonText = useRef<SVGTextPathElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(root);
  const { scrollY } = useScroll();
  const units = useRef<{ loop: number; ribbon: number }>({ loop: 0, ribbon: 0 });
  const desktop = useMedia("(min-width: 768px)");

  const loopCopy = `${lines[0]}${lines[2]}`;
  const ribbonCopy = `${lines[1]}${lines[0]}`;

  useAnimationFrame((t) => {
    if (reduce || !inView) return;
    const u = units.current;
    // Measure one repetition once fonts have settled (text holds two copies).
    if (!u.loop && loopText.current) u.loop = loopText.current.getComputedTextLength() / 2;
    if (!u.ribbon && ribbonText.current) u.ribbon = ribbonText.current.getComputedTextLength() / 2;
    const base = t * 0.045 + scrollY.get() * 0.5;
    if (u.loop && loopText.current) {
      loopText.current.setAttribute("startOffset", String((base % u.loop) - u.loop));
    }
    if (u.ribbon && ribbonText.current) {
      ribbonText.current.setAttribute("startOffset", String(((base * 1.2) % u.ribbon) - u.ribbon));
    }
  });

  return (
    <svg
      ref={root}
      aria-hidden
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 -z-10 size-full select-none"
    >
      <defs>
        <path id="drift-loop" d="M -120 705 C 60 712 240 708 360 660 A 175 175 0 1 0 150 640 C 210 760 250 860 320 1000" />
        <path
          id="drift-ribbon"
          d={desktop ? "M 820 1010 C 1040 905 1250 835 1560 770" : "M 420 975 C 600 905 800 860 1020 790"}
        />
      </defs>

      <g className="hidden md:block">
        <text className="fill-faint/70 font-sans text-[21px]" style={{ letterSpacing: "0.01em" }}>
          <textPath ref={loopText} href="#drift-loop" startOffset="-200">
            {loopCopy}
            {loopCopy}
          </textPath>
        </text>
      </g>

      <use href="#drift-ribbon" className="fill-none stroke-fg" strokeWidth={46} strokeLinecap="round" />
      <text className="fill-bg font-sans text-[20px] font-medium" dominantBaseline="central">
        <textPath ref={ribbonText} href="#drift-ribbon" startOffset="-300">
          {ribbonCopy}
          {ribbonCopy}
        </textPath>
      </text>
    </svg>
  );
}
