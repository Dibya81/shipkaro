import Link from "next/link";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { hero, tracker } from "@/config/site";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="container-page grid items-center gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-24"
    >
      <div className="flex flex-col items-start gap-7">
        <span className="rounded-full border border-line-strong px-3.5 py-2 text-[13px] font-medium tracking-[0.02em] text-soft">
          {hero.pill}
        </span>

        <h1
          id="hero-heading"
          className="font-display text-[clamp(48px,6.4vw,92px)] leading-[0.98] tracking-[-0.04em]"
        >
          {hero.headlineLine1}
          <br />
          <span className="text-accent-strong">{hero.headlineLine2}</span>
        </h1>

        <p className="max-w-[520px] text-[17px] leading-relaxed text-muted sm:text-[19px]">
          {hero.subtext}
        </p>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href={hero.primaryCta.href} className="btn btn-primary group">
            {hero.primaryCta.label}
            <ArrowRight
              className="size-[18px] transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <Link href={hero.secondaryCta.href} className="btn btn-ghost">
            {hero.secondaryCta.label}
          </Link>
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-soft">
          {hero.ticks.map((t) => (
            <li key={t} className="inline-flex items-center gap-2">
              <Check className="size-4 text-accent-strong" strokeWidth={2.5} aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <DeliveryTracker />
    </section>
  );
}

function DeliveryTracker() {
  return (
    <aside
      aria-label={`${tracker.label}: ${tracker.project}`}
      className="flex flex-col gap-[22px] rounded-[20px] border border-line bg-card p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-faint">
            <span className="live-dot size-1.5 rounded-full bg-accent" aria-hidden />
            {tracker.label}
          </span>
          <span className="font-display text-[22px] font-semibold tracking-[-0.02em]">
            {tracker.project}
          </span>
        </div>
        <span className="rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-ink">
          {tracker.tag}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[13px] text-faint">
          <span>Progress</span>
          <span className="font-medium text-soft">{tracker.progress}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Project progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={tracker.progress}
          className="h-2 overflow-hidden rounded-full bg-line"
        >
          <div
            className="progress-fill h-full rounded-full bg-accent"
            style={{ width: `${tracker.progress}%` }}
          />
        </div>
      </div>

      <ol className="flex flex-col gap-3.5">
        {tracker.steps.map((s) => (
          <li
            key={s.title}
            className={
              "flex items-center gap-3.5 rounded-xl px-4 py-3.5 " +
              (s.status === "active" ? "border border-accent-line bg-accent-wash" : "bg-raised")
            }
          >
            <StepIcon status={s.status} />
            <span className={"flex-1 text-[15px] " + (s.status === "next" ? "text-muted" : "")}>
              {s.title}
            </span>
            <span
              className={
                "text-[13px] " + (s.status === "active" ? "text-accent-text" : "text-faint")
              }
            >
              {tracker.statusLabels[s.status]}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-3 border-t border-line pt-4">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-raised-2"
        >
          <MessageCircle className="size-[18px] text-accent-strong" />
        </span>
        <span className="text-sm text-muted">{tracker.footnote}</span>
      </div>
    </aside>
  );
}

function StepIcon({ status }: { status: "done" | "active" | "next" }) {
  if (status === "done") {
    return (
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success-bg"
      >
        <Check className="size-4 text-success" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={
        "size-7 shrink-0 rounded-full border-2 " +
        (status === "active" ? "border-accent-strong" : "border-ring-idle")
      }
    />
  );
}
