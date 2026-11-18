"use client";

import Image from "next/image";
import { useRef } from "react";
import { m, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { statement } from "@/config/site";
import { useMedia } from "@/components/home/useMedia";

/**
 * Pinned comparison, told in two acts as you scroll:
 * 1. "The usual way" card fades out while the photo window closes in from both
 *    sides into a centred portrait (the long process collapses into one chat).
 * 2. The portrait stays with you while the ShipKaro lines play one after another.
 * Motion is clip-path + transform + opacity only.
 */
const COLLAPSE = [0.04, 0.4];
// Scroll windows for each line in act 2: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd].
// Must stay inside 0..1 and never decrease: Motion hands these to the Web Animations API.
const LINE_WINDOWS: [number, number, number, number][] = [
  [0, 0, 0.54, 0.6],
  [0.6, 0.65, 0.77, 0.82],
  [0.82, 0.87, 1, 1],
];

export function Statement() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const desktop = useMedia("(min-width: 768px)");
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const still = useMotionValue(0);
  const p = reduce ? still : scrollYProgress;

  const left = useTransform(p, COLLAPSE, desktop ? [27, 32] : [0, 14], { clamp: true });
  const right = useTransform(p, COLLAPSE, desktop ? [0, 32] : [0, 14], { clamp: true });
  const clipPath = useTransform(() => `inset(0% ${right.get()}% 0% ${left.get()}% round 28px)`);
  const labelX = useTransform(p, COLLAPSE, desktop ? ["13.5%", "0%"] : ["0%", "0%"]);
  const imageScale = useTransform(p, [0, 1], [1.2, 1]);
  const cardOpacity = useTransform(p, [0.04, 0.3], [1, 0]);
  const cardX = useTransform(p, [0.04, 0.3], [0, -70]);

  return (
    <div ref={ref} className="relative h-[300vh] md:h-[380vh]">
      <div className="sticky top-0 flex h-[100dvh] flex-col justify-center pb-10 pt-24">
        <div className="container-page flex flex-col items-center text-center">
          <h2 className="max-w-[16ch] font-display text-[clamp(44px,5.6vw,84px)] leading-[1.04] tracking-[-0.03em] lg:max-w-none">
            {statement.headingStart}{" "}
            <em className="inline-block pb-2 leading-[1.1]">{statement.headingItalic}</em>
          </h2>
          <p className="mt-3 max-w-[52ch] text-[17px] leading-relaxed text-sheet-muted sm:text-lg">
            {statement.subtext}
          </p>

          <div className="relative mt-8 h-[clamp(320px,48vh,520px)] w-full max-w-[1100px]">
            <m.div
              style={{ opacity: cardOpacity, x: cardX }}
              className="absolute inset-y-0 left-0 hidden w-[25%] flex-col justify-center gap-5 rounded-[28px] border border-sheet-line px-7 text-left md:flex"
            >
              <span className="text-[15px] text-sheet-muted">{statement.agencyLabel}</span>
              <ul className="flex flex-col gap-3">
                {statement.agencySteps.map((step) => (
                  <li
                    key={step}
                    className="font-display text-[clamp(22px,2.1vw,28px)] leading-tight text-sheet-muted line-through decoration-accent/70 decoration-1"
                  >
                    {step}
                  </li>
                ))}
              </ul>
            </m.div>

            <m.div style={{ clipPath }} className="absolute inset-0 overflow-hidden will-change-[clip-path]">
              <m.div style={{ scale: imageScale }} className="absolute inset-0">
                <Image
                  src={statement.image}
                  alt={statement.imageAlt}
                  fill
                  sizes="(min-width: 1140px) 1100px, 100vw"
                  className="object-cover"
                />
              </m.div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/45" />
              <m.div
                style={{ x: labelX }}
                className="absolute inset-0 flex flex-col items-center pt-8 text-[#ffffeb]"
              >
                <span className="text-[15px] opacity-85">{statement.shipLabel}</span>
                <div className="relative mt-1 h-[2.6em] w-full text-[clamp(26px,2.5vw,36px)]">
                  {statement.shipLines.map((line, i) => (
                    <ShipLine key={line} text={line} progress={p} window={LINE_WINDOWS[i]} />
                  ))}
                </div>
              </m.div>
            </m.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShipLine({
  text,
  progress,
  window: [a, b, c, d],
}: {
  text: string;
  progress: MotionValue<number>;
  window: [number, number, number, number];
}) {
  // The first line is already showing at the start; the last one stays at the end.
  const first = b === 0;
  const last = c === 1;
  const opacity = useTransform(progress, [a, b, c, d], [first ? 1 : 0, 1, 1, last ? 1 : 0]);
  const y = useTransform(progress, [a, b, c, d], [first ? 0 : 18, 0, 0, last ? 0 : -18]);
  return (
    <m.span
      style={{ opacity, y }}
      className="absolute inset-x-4 top-0 font-display leading-[1.1]"
    >
      {text}
    </m.span>
  );
}
