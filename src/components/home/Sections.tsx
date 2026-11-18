import Image from "next/image";
import { Asterisk, MessageCircle } from "lucide-react";
import { capabilities, capabilitiesLabel, ctaBand, faqSection } from "@/config/site";
import { whatsappLink } from "@/lib/whatsapp";
import { Reveal } from "@/components/Reveal";
import { Statement } from "@/components/home/Statement";
import { Audiences } from "@/components/home/Audiences";
import { ProcessStory } from "@/components/home/ProcessStory";
import { FaqTabs } from "@/components/home/FaqTabs";

/*
 * The page reads as stacked sheets of paper: each section after the hero has
 * rounded top corners and slides over the one before it (-mt + later DOM order).
 * Ink sheets and cream sheets alternate once each way, deliberately.
 */
const creamSheet = "sheet relative -mt-10 bg-bg";
const inkSheet = "sheet relative -mt-10 bg-sheet text-sheet-fg";

/* Ink sheet 1: capability marquee + the one-chat statement ----------- */
export function IntroSheet() {
  const row = [...capabilities, ...capabilities];
  return (
    <section aria-label="What we work on" className="sheet relative bg-sheet text-sheet-fg">
      <div className="pt-16 md:pt-20">
        <p className="container-page text-center text-[15px] text-sheet-muted">{capabilitiesLabel}</p>
        <div className="marquee relative mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <ul className="marquee-track flex w-max items-center">
            {row.map((c, i) => (
              <li
                key={i}
                aria-hidden={i >= capabilities.length}
                className="flex items-center gap-10 pr-10 font-display text-[clamp(30px,3.6vw,48px)] leading-none"
              >
                {c}
                <Asterisk aria-hidden className="size-6 text-accent" strokeWidth={2} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Statement />
    </section>
  );
}

/* Cream sheet: how it works ------------------------------------------ */
export function ProcessSheet() {
  return (
    <div className={creamSheet}>
      <ProcessStory />
    </div>
  );
}

/* Ink sheet 2: who we build for (floating boxes) --------------------- */
export function AudienceSheet() {
  return (
    <div className={inkSheet + " overflow-x-clip"}>
      <Audiences />
    </div>
  );
}

/* Cream sheet: FAQ + closing CTA ------------------------------------- */
export function ClosingSheet() {
  return (
    <div className={creamSheet + " pb-3"}>
      <section id="faq" aria-labelledby="faq-heading" className="container-page pb-24 pt-28 md:pb-32 md:pt-36">
        <Reveal className="flex flex-col items-center text-center">
          <h2
            id="faq-heading"
            className="font-display text-[clamp(48px,6.6vw,100px)] leading-[1.02] tracking-[-0.03em]"
          >
            {faqSection.headingStart}{" "}
            <em className="inline-block pb-3 leading-[1.1]">{faqSection.headingItalic}</em>
          </h2>
        </Reveal>
        <Reveal className="mx-auto mt-14 max-w-[1040px]">
          <FaqTabs />
        </Reveal>
      </section>

      <section aria-labelledby="cta-heading" className="px-3 sm:px-4">
        <div className="relative isolate flex min-h-[86dvh] items-center justify-center overflow-hidden rounded-[32px] px-6 py-24 text-center text-[#ffffeb] sm:rounded-[40px]">
          <Image
            src={ctaBand.image}
            alt={ctaBand.imageAlt}
            fill
            sizes="100vw"
            className="-z-10 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[#161614]/60" />
          <Reveal className="flex flex-col items-center">
            <h2
              id="cta-heading"
              className="font-display text-[clamp(48px,7.4vw,116px)] leading-[1] tracking-[-0.03em]"
            >
              {ctaBand.headingStart}
              <br />
              <em className="inline-block pb-3 leading-[1.1]">{ctaBand.headingItalic}</em>
            </h2>
            <p className="mt-5 max-w-[42ch] text-[18px] leading-relaxed text-[#ffffeb]/85">{ctaBand.subtext}</p>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary mt-9 min-h-14 px-8 text-[17px]"
            >
              <MessageCircle className="size-5" aria-hidden />
              {ctaBand.buttonLabel}
            </a>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
