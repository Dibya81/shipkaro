import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { hero } from "@/config/site";
import { HeroDrift } from "@/components/home/HeroDrift";

/** Centered editorial hero. The curved lines of client requests drift around it. */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center overflow-x-clip pb-28 pt-16 sm:pb-36"
    >
      <HeroDrift lines={hero.driftLines} />

      <div className="container-page relative flex flex-col items-center text-center">
        <span
          className="rise text-[13px] font-medium uppercase tracking-[0.16em] text-faint"
          style={{ animationDelay: "0.05s" }}
        >
          {hero.eyebrow}
        </span>

        <h1
          id="hero-heading"
          className="rise mt-7 font-display text-[clamp(60px,9vw,136px)] leading-[0.95] tracking-[-0.035em]"
          style={{ animationDelay: "0.15s" }}
        >
          {hero.headlineLine1}
          <br />
          <em className="inline-block pb-2 leading-[1.08] text-accent-strong">{hero.headlineLine2}</em>
        </h1>

        <p
          className="rise mt-6 max-w-[34ch] text-[18px] leading-relaxed text-soft sm:text-[21px]"
          style={{ animationDelay: "0.3s" }}
        >
          {hero.subtext}
        </p>

        <div className="rise mt-9" style={{ animationDelay: "0.42s" }}>
          <Link href={hero.primaryCta.href} className="btn btn-primary group min-h-14 px-8 text-[17px]">
            {hero.primaryCta.label}
            <ArrowRight
              className="size-[18px] transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
