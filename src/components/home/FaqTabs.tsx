"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { brand, faqSection } from "@/config/site";

const items = faqSection.items;

/**
 * FAQ as a conversation: questions in a list on the left, the answer arrives as a
 * chat reply on the right. Below md it becomes a regular accordion.
 */
export function FaqTabs() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + items.length) % items.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <>
      <div className="hidden grid-cols-[minmax(0,440px)_1fr] gap-3 rounded-[32px] bg-raised p-3 md:grid">
        <div role="tablist" aria-orientation="vertical" aria-label="Questions" className="flex flex-col gap-1 rounded-[24px] bg-sheet p-2.5 text-sheet-fg">
          {items.map((item, i) => (
            <button
              key={item.q}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`faq-tab-${i}`}
              aria-selected={i === active}
              aria-controls="faq-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={
                "min-h-12 rounded-[16px] px-4 py-3.5 text-left text-[16px] leading-snug transition-colors duration-200 " +
                (i === active ? "bg-white/12 text-sheet-fg" : "text-sheet-muted hover:bg-white/6 hover:text-sheet-fg")
              }
            >
              {item.q}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id="faq-panel"
          aria-labelledby={`faq-tab-${active}`}
          className="flex min-h-[420px] flex-col justify-end gap-4 p-6 lg:p-8"
        >
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={active}
              className="flex flex-col gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <m.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-[80%] self-end rounded-[20px] rounded-br-md bg-bg px-5 py-3.5 text-[16px] text-soft"
              >
                {items[active].q}
              </m.p>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex max-w-[85%] items-end gap-3"
              >
                <span
                  aria-hidden
                  className="logo-mark mb-1 h-[18px] w-[26px] shrink-0 text-fg"
                  style={{ maskImage: `url(${brand.logo})`, WebkitMaskImage: `url(${brand.logo})` }}
                />
                <div className="rounded-[20px] rounded-bl-md bg-card px-5 py-4 shadow-[0_10px_30px_-18px_rgb(60_60_20/0.35)]">
                  <span className="text-[12px] font-semibold text-faint">{faqSection.answerLabel}</span>
                  <p className="mt-1 text-[17px] leading-relaxed">{items[active].a}</p>
                </div>
              </m.div>
            </m.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col rounded-[24px] bg-raised p-2 md:hidden">
        {items.map((item) => (
          <details key={item.q} className="group rounded-[18px] open:bg-card">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <Plus aria-hidden className="size-5 shrink-0 text-accent-text transition-transform duration-300 group-open:rotate-45" />
            </summary>
            <p className="px-4 pb-5 leading-relaxed text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
