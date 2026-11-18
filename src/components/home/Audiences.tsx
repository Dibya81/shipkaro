"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { m, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { audienceSection, audiences, services, type Audience } from "@/config/site";
import { useMedia } from "@/components/home/useMedia";

const serviceBySlug = new Map(services.map((s) => [s.slug, s]));

const TONES: Record<Audience["tone"], { bg: string; fg: string }> = {
  accent: { bg: "var(--color-accent)", fg: "var(--color-ink)" },
  cream: { bg: "var(--tone-cream)", fg: "var(--tone-cream-fg)" },
  sand: { bg: "var(--tone-sand)", fg: "var(--tone-sand-fg)" },
  ink: { bg: "var(--tone-ink)", fg: "var(--tone-ink-fg)" },
  wash: { bg: "var(--tone-wash)", fg: "var(--tone-wash-fg)" },
};

// Per-card lane (vw offset) and tilt, so the stream feels hand-placed, not robotic.
const LANES = [6, -12, 11, -7, 3];
const TILTS: [number, number][] = [
  [-9, 3],
  [8, -4],
  [-6, 5],
  [9, -3],
  [-7, 4],
];
const WINDOW = 0.42;

/**
 * "Who we build for". The section pins, the heading sits in the middle, and one box
 * per audience floats up diagonally from the bottom right to the top left as you
 * scroll. Under reduced motion it is a plain grid.
 */
export function Audiences() {
  const reduce = useReducedMotion();
  return (
    <section id="build" aria-labelledby="build-heading" className="relative">
      {reduce ? <StaticGrid /> : <FloatingStream />}
      <div className="container-page flex justify-center pb-24 pt-6 md:pb-32">
        <Link
          href="/start?service=other"
          className="group inline-flex min-h-11 flex-wrap items-center justify-center gap-x-2 text-lg text-sheet-muted transition-colors hover:text-sheet-fg"
        >
          Something else?
          <span className="text-sheet-fg underline decoration-accent decoration-2 underline-offset-[6px]">
            Tell us your idea
          </span>
          <ArrowUpRight
            aria-hidden
            className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  );
}

function Heading({ className = "" }: { className?: string }) {
  return (
    <div className={"flex flex-col items-center text-center " + className}>
      <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-sheet-muted">
        {audienceSection.eyebrow}
      </span>
      <h2
        id="build-heading"
        className="mt-6 font-display text-[clamp(48px,7vw,104px)] leading-[1.02] tracking-[-0.03em]"
      >
        {audienceSection.headingStart}
        <br />
        <em className="inline-block pb-3 leading-[1.1]">{audienceSection.headingItalic}</em>
      </h2>
    </div>
  );
}

function FloatingStream() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const step = (1 - WINDOW) / (audiences.length - 1);

  return (
    <div ref={ref} className="relative h-[520vh]">
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <Heading className="container-page absolute inset-0 justify-center" />
        <ul className="absolute inset-0">
          {audiences.map((a, i) => (
            <FloatingCard
              key={a.title}
              audience={a}
              index={i}
              progress={scrollYProgress}
              start={i * step}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function FloatingCard({
  audience,
  index,
  progress,
  start,
}: {
  audience: Audience;
  index: number;
  progress: MotionValue<number>;
  start: number;
}) {
  const span = [start, start + WINDOW];
  // Phones get a narrower, centred lane so every box is readable mid-flight.
  const desktop = useMedia("(min-width: 768px)");
  const lane = desktop ? LANES[index % LANES.length] : 0;
  const reach = desktop ? 46 : 24;
  const tilt = desktop ? 1 : 0.5;
  const [r0, r1] = TILTS[index % TILTS.length].map((r) => r * tilt);
  const x = useTransform(progress, span, [`${reach + lane}vw`, `${-reach + lane}vw`]);
  const y = useTransform(progress, span, ["98vh", "-98vh"]);
  const rotate = useTransform(progress, span, [r0, r1]);

  return (
    <m.li
      style={{ x, y, rotate }}
      className="absolute left-1/2 top-1/2 -ml-[min(220px,42vw)] -mt-[min(300px,40vh)] w-[min(440px,84vw)] will-change-transform"
    >
      <Card audience={audience} />
    </m.li>
  );
}

function StaticGrid() {
  return (
    <div className="container-page pb-6 pt-28">
      <Heading />
      <ul className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {audiences.map((a) => (
          <li key={a.title}>
            <Card audience={a} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Card({ audience }: { audience: Audience }) {
  const tone = TONES[audience.tone];
  return (
    <article
      className="rounded-[28px] p-2.5 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.55)]"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
    >
      <div className="relative aspect-[16/8] overflow-hidden rounded-[20px] md:aspect-[16/9]">
        <Image
          src={audience.image}
          alt={audience.imageAlt}
          fill
          sizes="(min-width: 768px) 440px, 84vw"
          className="object-cover"
        />
      </div>
      <div className="px-4 pb-3 pt-5">
        <h3 className="font-display text-[clamp(34px,3.2vw,42px)] leading-none tracking-[-0.02em]">
          {audience.title}
        </h3>
        <p className="mt-2.5 text-[15px] leading-snug opacity-80">{audience.description}</p>
        <ul className="mt-4 border-t border-current/15">
          {audience.slugs.map((slug) => {
            const s = serviceBySlug.get(slug);
            if (!s) return null;
            return (
              <li key={slug} className="border-b border-current/15 last:border-b-0">
                <Link
                  href={`/start?service=${slug}`}
                  className="group flex min-h-11 items-center justify-between gap-3 text-[15px] font-medium"
                >
                  <span>{s.title}</span>
                  <span className="flex items-center gap-2 text-[13px] font-normal opacity-75">
                    {s.highlight ? s.price : null}
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
