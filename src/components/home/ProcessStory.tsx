"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { AnimatePresence, m, useMotionValueEvent, useScroll } from "motion/react";
import { brand, processSection } from "@/config/site";
import { Reveal } from "@/components/Reveal";
import { scrollToY } from "@/components/SmoothScroll";

const steps = processSection.steps;
const ease = [0.16, 1, 0.3, 1] as const;

/**
 * "How it works" as a pinned story: the index on the left tracks progress, the photo
 * card in the middle swaps scene and chat message, the copy on the right follows.
 * Mobile gets a plain stacked list.
 */
export function ProcessStory() {
  return (
    <section id="process" aria-labelledby="process-heading" className="relative">
      <Reveal className="container-page flex flex-col items-center pb-6 pt-28 text-center md:pt-36">
        <h2
          id="process-heading"
          className="font-display text-[clamp(48px,6.6vw,100px)] leading-[1.02] tracking-[-0.03em]"
        >
          {processSection.headingStart}
          <br />
          <em className="inline-block pb-3 leading-[1.1] text-accent-strong">{processSection.headingItalic}</em>
        </h2>
      </Reveal>
      <PinnedStory />
      <StackedStory />
    </section>
  );
}

function Bubble({ index }: { index: number }) {
  const fromClient = index === 0;
  return (
    <div className="rounded-2xl bg-[#ffffeb] p-4 text-[#161614] shadow-[0_20px_50px_-20px_rgb(0_0_0/0.6)]">
      <span className="text-[12px] font-semibold text-[#55554d]">{fromClient ? "You" : brand.name}</span>
      <p className="mt-1 text-[15px] leading-snug">{steps[index].bubble}</p>
      <div className="mt-3 flex items-center justify-between border-t border-[#161614]/10 pt-2.5 text-[#67675e]">
        <span className="text-[12px]">WhatsApp</span>
        <SendHorizontal aria-hidden className="size-4" />
      </div>
    </div>
  );
}

function PinnedStory() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(steps.length - 1, Math.max(0, Math.floor(v * steps.length)));
    setActive((cur) => (cur === next ? cur : next));
  });

  const jumpTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    scrollToY(top + ((i + 0.5) / steps.length) * travel);
  };

  return (
    <div ref={ref} className="relative hidden md:block" style={{ height: `${steps.length * 75 + 25}vh` }}>
      <div className="sticky top-0 flex h-[100dvh] items-center pt-16">
        <div className="container-page grid grid-cols-[180px_minmax(0,400px)_1fr] items-center gap-10 lg:grid-cols-[220px_minmax(0,430px)_1fr] lg:gap-16">
          <ol aria-label="Steps" className="flex flex-col self-start border-l border-line pt-2">
            {steps.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  aria-current={i === active ? "step" : undefined}
                  className={
                    "relative -ml-px flex min-h-10 items-center border-l-2 pl-4 text-left font-display text-[19px] transition-colors duration-300 " +
                    (i === active ? "border-accent text-fg" : "border-transparent text-faint hover:text-soft")
                  }
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ol>

          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-raised">
            {steps.map((s, i) => (
              <m.div
                key={s.image}
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.08 }}
                transition={{ duration: 0.9, ease }}
              >
                <Image src={s.image} alt={s.imageAlt} fill sizes="430px" className="object-cover" />
              </m.div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute inset-x-5 bottom-5">
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={active}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease }}
                >
                  <Bubble index={active} />
                </m.div>
              </AnimatePresence>
            </div>
          </div>

          <div aria-live="polite" className="max-w-[380px]">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={active}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease }}
              >
                <h3 className="font-display text-[clamp(36px,3.4vw,48px)] leading-[1.05] tracking-[-0.02em]">
                  {steps[active].title}
                </h3>
                <p className="mt-4 text-[17px] leading-relaxed text-muted">{steps[active].description}</p>
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function StackedStory() {
  return (
    <ol className="container-page flex flex-col gap-14 pb-24 pt-10 md:hidden">
      {steps.map((s, i) => (
        <Reveal as="li" key={s.title} className="flex flex-col gap-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[24px]">
            <Image src={s.image} alt={s.imageAlt} fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute inset-x-4 bottom-4">
              <Bubble index={i} />
            </div>
          </div>
          <div>
            <h3 className="font-display text-[36px] leading-none tracking-[-0.02em]">{s.title}</h3>
            <p className="mt-3 text-[17px] leading-relaxed text-muted">{s.description}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
