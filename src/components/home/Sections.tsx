import Link from "next/link";
import { ArrowRight, ArrowUpRight, MessageCircle, Plus } from "lucide-react";
import {
  buildSection,
  capabilities,
  ctaBand,
  faqSection,
  processSection,
  services,
  somethingElse,
} from "@/config/site";
import { whatsappLink } from "@/lib/whatsapp";
import { Reveal } from "@/components/Reveal";

const eyebrow = "text-[13px] font-semibold uppercase tracking-[0.1em] text-accent-text";
const h2 = "font-display text-[clamp(36px,4.4vw,56px)] leading-[1.05] tracking-[-0.03em]";

/* 3. Capability strip ------------------------------------------------ */
export function CapabilityStrip() {
  return (
    <div className="border-y border-line-soft">
      <ul
        aria-label="What we work on"
        className="container-page flex flex-wrap justify-between gap-x-8 gap-y-[18px] py-7 font-display text-base font-medium tracking-[-0.01em] text-faint sm:text-lg"
      >
        {capabilities.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </div>
  );
}

/* 4. What we build --------------------------------------------------- */
export function BuildGrid() {
  return (
    <section
      id="build"
      aria-labelledby="build-heading"
      className="container-page flex flex-col gap-12 pb-10 pt-[100px] lg:pt-[120px]"
    >
      <Reveal className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex max-w-[680px] flex-col gap-3.5">
          <span className={eyebrow}>{buildSection.eyebrow}</span>
          <h2 id="build-heading" className={h2}>
            {buildSection.heading}
          </h2>
        </div>
        <p className="max-w-[380px] leading-relaxed text-muted">{buildSection.subtext}</p>
      </Reveal>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s, i) => (
          <Reveal as="li" key={s.slug} delay={(i % 4) * 0.05} className="flex">
            <Link
              href={`/start?service=${s.slug}`}
              className="group relative flex w-full flex-col gap-2.5 rounded-2xl border border-line bg-card p-6 transition-colors duration-200 hover:border-line-strong hover:bg-card-hover"
            >
              <ArrowUpRight
                aria-hidden
                className="absolute right-5 top-5 size-[18px] text-faint opacity-0 transition-all duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
              />
              <h3 className="pr-6 font-display text-[19px] font-bold tracking-[-0.01em]">{s.title}</h3>
              <p className="flex-1 text-sm leading-[1.55] text-muted">{s.description}</p>
              <span
                className={
                  "mt-1 self-start rounded-full border px-2.5 py-1 text-xs " +
                  (s.highlight
                    ? "border-accent-line font-semibold text-accent-text"
                    : "border-line-strong text-soft")
                }
              >
                {s.price}
              </span>
            </Link>
          </Reveal>
        ))}
        <Reveal as="li" delay={0.15} className="flex">
          <Link
            href="/start"
            className="on-accent group flex w-full flex-col gap-2.5 rounded-2xl bg-accent p-6 text-ink transition-colors duration-200 hover:bg-accent-hover"
          >
            <span className="font-display text-[19px] font-bold tracking-[-0.01em]">
              {somethingElse.title}
            </span>
            <span className="flex-1 text-sm leading-[1.55]">{somethingElse.description}</span>
            <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold">
              {buildSection.somethingElseCta}
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </Reveal>
      </ul>
    </section>
  );
}

/* 5. Process --------------------------------------------------------- */
export function Process() {
  return (
    <section
      id="process"
      aria-labelledby="process-heading"
      className="container-page flex flex-col gap-12 pb-10 pt-[100px]"
    >
      <Reveal className="flex max-w-[640px] flex-col gap-3.5">
        <span className={eyebrow}>{processSection.eyebrow}</span>
        <h2 id="process-heading" className={h2}>
          {processSection.heading}
        </h2>
      </Reveal>

      <ol className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
        {processSection.steps.map((step, i) => (
          <Reveal
            as="li"
            key={step.title}
            delay={i * 0.08}
            className={
              "flex flex-col gap-2.5 border-t-2 pt-5 " +
              (i === 0 ? "border-accent" : "border-line-strong")
            }
          >
            <span
              aria-hidden
              className={"font-display text-sm font-medium " + (i === 0 ? "text-accent-text" : "text-faint")}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-[15px] leading-relaxed text-muted">{step.description}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

/* 6. FAQ ------------------------------------------------------------- */
export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="container-page pb-10 pt-[100px]"
    >
      <div className="mx-auto flex max-w-[832px] flex-col gap-10">
      <Reveal>
        <h2 id="faq-heading" className={h2}>
          {faqSection.heading}
        </h2>
      </Reveal>
      <Reveal className="flex flex-col border-t border-line">
        {faqSection.items.map((item) => (
          <details key={item.q} className="group border-b border-line">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-6 text-[17px] font-semibold sm:text-lg [&::-webkit-details-marker]:hidden">
              {item.q}
              <Plus
                aria-hidden
                className="size-5 shrink-0 text-accent-text transition-transform duration-300 group-open:rotate-45"
              />
            </summary>
            <p className="-mt-2 pb-6 pr-9 leading-[1.7] text-muted">{item.a}</p>
          </details>
        ))}
      </Reveal>
      </div>
    </section>
  );
}

/* 7. CTA band -------------------------------------------------------- */
export function CtaBand() {
  return (
    <section aria-labelledby="cta-heading" className="container-page py-[100px]">
      <Reveal className="on-accent flex flex-col items-start justify-between gap-8 rounded-[28px] bg-accent p-[clamp(32px,6vw,80px)] text-ink lg:flex-row lg:items-center">
        <h2
          id="cta-heading"
          className="max-w-[640px] font-display text-[clamp(36px,5vw,64px)] leading-none tracking-[-0.04em]"
        >
          {ctaBand.heading}
        </h2>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ink min-h-14 rounded-[14px] px-7 text-[17px]"
        >
          <MessageCircle className="size-5" aria-hidden />
          {ctaBand.buttonLabel}
        </a>
      </Reveal>
    </section>
  );
}
