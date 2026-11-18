import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { hero, notFoundPage } from "@/config/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="container-page flex min-h-[70dvh] flex-col justify-center gap-7 py-20">
      <span className="font-display text-[clamp(96px,18vw,200px)] leading-none tracking-[-0.05em] text-accent-strong">
        404
      </span>
      <h1 className="font-display text-[clamp(32px,4.4vw,56px)] leading-[1.05] tracking-[-0.03em]">
        {notFoundPage.heading}
      </h1>
      <p className="max-w-[46ch] text-[17px] leading-relaxed text-muted">{notFoundPage.body}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary">
          {notFoundPage.homeLabel}
        </Link>
        <Link href={hero.primaryCta.href} className="btn btn-ghost">
          {hero.primaryCta.label}
          <ArrowRight className="size-[18px]" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
