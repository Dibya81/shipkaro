"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, m } from "motion/react";
import { Check, CircleAlert, MessageCircle, Send, Sparkles } from "lucide-react";
import {
  addonsFor,
  budgetRanges,
  categories,
  categoryOf,
  findItem,
  formatINR,
  speeds,
  startingPrice,
  type SpeedId,
} from "@/config/pricing";
import { policies, startPage } from "@/config/site";
import { computeEstimate, type Selection } from "@/lib/model";
import { whatsappLink } from "@/lib/whatsapp";

const OTHER = "other";
const ease = [0.16, 1, 0.3, 1] as const;
const { fields, errors: errorText, builder } = startPage;

type Details = { name: string; phone: string; email: string; org: string; deadline: string; notes: string; budget: string };
type Errors = Partial<Record<"item" | "name" | "phone" | "notes", string>>;

const noopSubscribe = () => () => {};
const msSince = (t: number) => (t ? Date.now() - t : 0);
const now = () => Date.now();
const readServiceParam = () => new URLSearchParams(window.location.search).get("service");

function formatDate(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

const inputBase =
  "min-h-12 w-full rounded-xl border bg-bg px-4 py-3 text-base text-fg placeholder:text-placeholder transition-colors focus:border-accent-strong focus:outline-none";

export function ProjectBuilder() {
  const uid = useId();
  const id = (s: string) => `${uid}-${s}`;
  const urlService = useSyncExternalStore(noopSubscribe, readServiceParam, () => null);

  const [pickedItem, setPickedItem] = useState<string | null>(null);
  const [pickedCategory, setPickedCategory] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | undefined>();
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [speed, setSpeed] = useState<SpeedId>("standard");
  const [d, setD] = useState<Details>({ name: "", phone: "", email: "", org: "", deadline: "", notes: "", budget: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Spam checks (invisible to people): a hidden field only bots fill in, and how long the form was open.
  const trap = useRef<HTMLInputElement>(null);
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = now();
  }, []);

  // URL ?service=<slug> preselects; a click always wins.
  const fromUrl = urlService === OTHER || findItem(urlService) ? urlService : null;
  const itemSlug = pickedItem ?? fromUrl;
  const item = findItem(itemSlug);
  const isOther = itemSlug === OTHER;
  const categoryId = pickedCategory ?? (item ? categoryOf(item.slug)?.id : isOther ? OTHER : categories[0].id);
  const category = categories.find((c) => c.id === categoryId);
  const custom = isOther || !!item?.quoteOnly;

  const selection: Selection = {
    itemSlug: itemSlug ?? "",
    variantId: variantId ?? item?.variants?.[0]?.id,
    addonIds,
    speed,
  };
  const estimate = computeEstimate(selection);
  const speedInfo = speeds.find((s) => s.id === speed)!;

  function chooseItem(slug: string) {
    setPickedItem(slug);
    setVariantId(undefined);
    setAddonIds([]);
    setErrors((e) => ({ ...e, item: undefined }));
    window.history.replaceState(null, "", `?service=${slug}`);
  }

  function chooseCategory(cid: string) {
    setPickedCategory(cid);
    if (cid === OTHER) chooseItem(OTHER);
  }

  function toggleAddon(aid: string) {
    setAddonIds((cur) => (cur.includes(aid) ? cur.filter((x) => x !== aid) : [...cur, aid]));
  }

  function update<K extends keyof Details>(k: K, v: string) {
    setD((x) => ({ ...x, [k]: v }));
    if (errors[k as keyof Errors]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!itemSlug) e.item = errorText.service;
    if (d.name.trim().length < 2) e.name = errorText.name;
    const digits = d.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) e.phone = errorText.phone;
    if (custom && d.notes.trim().length < 10) e.notes = errorText.description;
    return e;
  }

  function buildMessage() {
    const title = isOther ? builder.otherTitle : item!.title;
    const lines = [`*${startPage.messageTitle}*`, "", `*What:* ${title}`];
    if (!custom) {
      for (const l of estimate.lines) lines.push(`• ${l.label}: ${formatINR(l.amount)}${l.recurring ? "/month" : ""}`);
      if (estimate.speedFee) lines.push(`• ${speedInfo.label} delivery: ${formatINR(estimate.speedFee)}`);
      lines.push(`*Estimate:* ${formatINR(estimate.total)}${estimate.monthly ? ` + ${formatINR(estimate.monthly)}/month` : ""}`);
    } else {
      lines.push(`*Budget:* ${d.budget || "Not sure yet"}`);
    }
    lines.push(
      `*Speed:* ${speedInfo.label}`,
      `*Deadline:* ${formatDate(d.deadline) || "Flexible"}`,
      "",
      `*Name:* ${d.name.trim()}`,
      `*WhatsApp:* ${d.phone.trim()}`,
    );
    if (d.email.trim()) lines.push(`*Email:* ${d.email.trim()}`);
    if (d.org.trim()) lines.push(`*${fields.org}:* ${d.org.trim()}`);
    if (d.notes.trim()) lines.push("", "*Details:*", d.notes.trim());
    return lines.join("\n");
  }

  async function submit() {
    const found = validate();
    setErrors(found);
    const first = (["item", "name", "phone", "notes"] as const).find((k) => found[k]);
    if (first) {
      const el = document.getElementById(id(first));
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    const message = buildMessage();
    const url = whatsappLink(message);
    // Open the WhatsApp tab inside the click (so pop-up blockers allow it), save the
    // request and ping Telegram, then point the tab at WhatsApp. WhatsApp always opens,
    // even if saving fails or takes too long.
    const win = window.open("", "_blank");
    setSending(true);
    // The server rechecks the price, saves the request and pings Telegram.
    const save = fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selection,
        hp: trap.current?.value ?? "",
        elapsed: msSince(openedAt.current),
        details: {
          name: d.name.trim(),
          phone: d.phone.trim(),
          email: d.email.trim(),
          org: d.org.trim(),
          deadline: d.deadline,
          budget: custom ? d.budget : "",
          notes: d.notes.trim(),
        },
      }),
      keepalive: true,
    }).then((res) => {
      if (!res.ok) throw new Error(`Saving request failed (${res.status})`);
    });
    save.catch((err) => console.warn("Request not saved", err));
    await Promise.race([save.catch(() => {}), new Promise((r) => setTimeout(r, 4000))]);
    setSending(false);
    if (win && !win.closed) {
      win.opener = null;
      win.location.href = url;
    } else {
      window.location.assign(url);
    }
    setSentUrl(url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (sentUrl) {
    return (
      <div className="container-page flex min-h-[70dvh] items-center py-20">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          role="status"
          className="mx-auto flex max-w-[560px] flex-col items-center text-center"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-success-bg">
            <Check className="size-7 text-success" strokeWidth={2.5} aria-hidden />
          </span>
          <h1 className="mt-6 font-display text-[clamp(40px,5vw,60px)] leading-[1.05] tracking-[-0.03em]">
            {startPage.success.heading}
          </h1>
          <p className="mt-4 text-[17px] leading-relaxed text-muted">{startPage.success.body}</p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <a href={sentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <MessageCircle className="size-5" aria-hidden />
              {startPage.success.retry}
            </a>
            <button type="button" onClick={() => setSentUrl(null)} className="btn btn-ghost">
              {startPage.success.reset}
            </button>
          </div>
        </m.div>
      </div>
    );
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  const step = (n: number, title: string, hint?: string) => (
    <div className="mb-5 flex items-baseline gap-3">
      <span aria-hidden className="font-display text-[22px] italic text-accent-strong">
        {n}
      </span>
      <div>
        <h2 className="font-display text-[clamp(26px,2.6vw,32px)] leading-tight tracking-[-0.02em]">{title}</h2>
        {hint && <p className="mt-1 text-[15px] text-muted">{hint}</p>}
      </div>
    </div>
  );

  return (
    <div className="container-page pb-32 pt-12 sm:pt-16 lg:pb-24">
      <header className="mx-auto max-w-[760px] text-center">
        <h1 className="font-display text-[clamp(44px,6vw,84px)] leading-[1.02] tracking-[-0.03em]">
          {builder.headingStart} <em className="inline-block pb-2 leading-[1.1] text-accent-strong">{builder.headingItalic}</em>
        </h1>
        <p className="mx-auto mt-4 max-w-[52ch] text-[17px] leading-relaxed text-muted sm:text-lg">{startPage.subtext}</p>
      </header>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12"
      >
        <input
          ref={trap}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="pointer-events-none absolute -left-[9999px] h-px w-px opacity-0"
        />
        <div className="flex min-w-0 flex-col gap-14">
          {errorCount > 0 && (
            <p role="alert" className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              <CircleAlert className="size-4 shrink-0" aria-hidden />
              Please fix {errorCount === 1 ? "1 thing" : `${errorCount} things`} below.
            </p>
          )}

          {/* 1. What */}
          <section aria-labelledby={id("s1")}>
            <div id={id("s1")}>{step(1, builder.step1, builder.step1Hint)}</div>
            <div role="tablist" aria-label="Who is it for" className="flex flex-wrap gap-2">
              {[...categories.map((c) => ({ id: c.id, title: c.title })), { id: OTHER, title: builder.otherTab }].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={categoryId === c.id}
                  onClick={() => chooseCategory(c.id)}
                  className={
                    "min-h-11 rounded-full border px-4 text-[15px] font-medium transition-colors " +
                    (categoryId === c.id ? "border-fg bg-fg text-bg" : "border-line-strong text-soft hover:border-faint hover:text-fg")
                  }
                >
                  {c.title}
                </button>
              ))}
            </div>

            <div id={id("item")} tabIndex={-1} className="mt-5 focus:outline-none">
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={categoryId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease }}
                >
                  {categoryId === OTHER ? (
                    <div className="rounded-[20px] border border-accent bg-accent-wash p-5">
                      <p className="flex items-center gap-2 font-display text-[24px] leading-tight">
                        <Sparkles className="size-5 text-accent-strong" aria-hidden />
                        {builder.otherTitle}
                      </p>
                      <p className="mt-2 text-[15px] leading-relaxed text-soft">{builder.otherBody}</p>
                    </div>
                  ) : (
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {category?.items.map((it) => {
                        const from = startingPrice(it);
                        const active = itemSlug === it.slug;
                        return (
                          <li key={it.slug}>
                            <label
                              className={
                                "flex h-full cursor-pointer flex-col gap-2 rounded-[20px] border p-5 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-strong " +
                                (active ? "border-accent bg-accent-wash" : "border-line bg-card hover:border-line-strong")
                              }
                            >
                              <input
                                type="radio"
                                name="item"
                                value={it.slug}
                                checked={active}
                                onChange={() => chooseItem(it.slug)}
                                className="sr-only"
                              />
                              <span className="flex items-start justify-between gap-3">
                                <span className="font-display text-[22px] leading-tight">{it.title}</span>
                                <span
                                  aria-hidden
                                  className={
                                    "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2 " +
                                    (active ? "border-accent-strong bg-accent-strong" : "border-ring-idle")
                                  }
                                >
                                  {active && <Check className="size-3 text-bg" strokeWidth={3.5} />}
                                </span>
                              </span>
                              <span className="flex-1 text-[14px] leading-relaxed text-muted">{it.summary}</span>
                              <span className="flex items-center justify-between gap-3 pt-1 text-[14px]">
                                <span className="font-semibold text-fg">
                                  {from === null ? builder.quoteLabel : `${builder.fromLabel} ${formatINR(from)}`}
                                </span>
                                <span className="text-faint">{it.days}</span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </m.div>
              </AnimatePresence>
              {errors.item && <FieldError className="mt-3">{errors.item}</FieldError>}
            </div>
          </section>

          {/* 2. Package and extras */}
          {item && !item.quoteOnly && (item.variants?.length || addonsFor(item).length > 0) && (
            <section aria-labelledby={id("s2")}>
              <div id={id("s2")}>{step(2, builder.step2, builder.step2Hint)}</div>
              {item.variants && (
                <fieldset className="mb-5">
                  <legend className="mb-3 text-sm font-medium text-label">{builder.packageLabel}</legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {item.variants.map((v) => {
                      const active = selection.variantId === v.id;
                      return (
                        <label
                          key={v.id}
                          className={
                            "flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent-strong " +
                            (active ? "border-accent bg-accent-wash" : "border-line bg-card hover:border-line-strong")
                          }
                        >
                          <input type="radio" name="variant" checked={active} onChange={() => setVariantId(v.id)} className="sr-only" />
                          <span className="text-[15px] font-medium">{v.label}</span>
                          <span className="text-[15px] font-semibold">{formatINR(v.price)}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              {addonsFor(item).length > 0 && (
                <fieldset>
                  <legend className="mb-3 text-sm font-medium text-label">{builder.extrasLabel}</legend>
                  <ul className="overflow-hidden rounded-2xl border border-line bg-card">
                    {addonsFor(item).map((a) => {
                      const on = addonIds.includes(a.id);
                      return (
                        <li key={a.id} className="border-b border-line last:border-b-0">
                          <label className="flex min-h-14 cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-card-hover has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-accent-strong">
                            <input type="checkbox" checked={on} onChange={() => toggleAddon(a.id)} className="sr-only" />
                            <span
                              aria-hidden
                              className={
                                "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors " +
                                (on ? "border-accent-strong bg-accent-strong" : "border-ring-idle")
                              }
                            >
                              {on && <Check className="size-3.5 text-bg" strokeWidth={3.5} />}
                            </span>
                            <span className="flex-1 text-[15px]">{a.label}</span>
                            <span className="whitespace-nowrap text-[15px] font-medium text-soft">
                              +{formatINR(a.price)}
                              {a.recurring && <span className="text-faint">/mo</span>}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              )}
            </section>
          )}

          {/* 3. Speed */}
          <section aria-labelledby={id("s3")}>
            <div id={id("s3")}>{step(item && !custom ? 3 : 2, builder.step3, builder.step3Hint)}</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {speeds.map((s) => {
                const active = speed === s.id;
                return (
                  <label
                    key={s.id}
                    className={
                      "flex cursor-pointer flex-col gap-1 rounded-2xl border px-4 py-4 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent-strong " +
                      (active ? "border-accent bg-accent-wash" : "border-line bg-card hover:border-line-strong")
                    }
                  >
                    <input type="radio" name="speed" checked={active} onChange={() => setSpeed(s.id)} className="sr-only" />
                    <span className="flex items-center justify-between">
                      <span className="text-[16px] font-semibold">{s.label}</span>
                      <span className="text-[13px] text-faint">
                        {s.multiplier === 1 ? builder.speedIncluded : `+${Math.round((s.multiplier - 1) * 100)}%`}
                      </span>
                    </span>
                    <span className="text-[14px] text-muted">{s.note}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-5 max-w-[280px]">
              <Field label={fields.deadline} htmlFor={id("deadline")}>
                <input
                  id={id("deadline")}
                  type="date"
                  value={d.deadline}
                  onFocus={(e) => (e.currentTarget.min = new Date().toISOString().slice(0, 10))}
                  onChange={(e) => update("deadline", e.target.value)}
                  className={`${inputBase} border-line-strong`}
                />
              </Field>
            </div>
          </section>

          {/* 4. Details */}
          <section aria-labelledby={id("s4")}>
            <div id={id("s4")}>{step(item && !custom ? 4 : 3, builder.step4, builder.step4Hint)}</div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label={fields.name} htmlFor={id("name")} required error={errors.name}>
                <input
                  id={id("name")}
                  autoComplete="name"
                  placeholder={fields.namePlaceholder}
                  value={d.name}
                  onChange={(e) => update("name", e.target.value)}
                  aria-invalid={!!errors.name}
                  className={`${inputBase} ${errors.name ? "border-danger" : "border-line-strong"}`}
                />
              </Field>
              <Field label={fields.phone} htmlFor={id("phone")} required error={errors.phone}>
                <input
                  id={id("phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={fields.phonePlaceholder}
                  value={d.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  aria-invalid={!!errors.phone}
                  className={`${inputBase} ${errors.phone ? "border-danger" : "border-line-strong"}`}
                />
              </Field>
              <Field label={builder.emailLabel} htmlFor={id("email")}>
                <input
                  id={id("email")}
                  type="email"
                  autoComplete="email"
                  placeholder={builder.emailPlaceholder}
                  value={d.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={`${inputBase} border-line-strong`}
                />
              </Field>
              <Field label={fields.org} htmlFor={id("org")}>
                <input
                  id={id("org")}
                  autoComplete="organization"
                  placeholder={fields.orgPlaceholder}
                  value={d.org}
                  onChange={(e) => update("org", e.target.value)}
                  className={`${inputBase} border-line-strong`}
                />
              </Field>
              {custom && (
                <Field label={builder.budgetLabel} htmlFor={id("budget")}>
                  <select
                    id={id("budget")}
                    value={d.budget}
                    onChange={(e) => update("budget", e.target.value)}
                    className={`${inputBase} border-line-strong`}
                  >
                    <option value="">{builder.budgetPlaceholder}</option>
                    {budgetRanges.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </Field>
              )}
              <div className="sm:col-span-2">
                <Field
                  label={custom ? builder.notesLabelCustom : fields.description}
                  htmlFor={id("notes")}
                  required={custom}
                  error={errors.notes}
                >
                  <textarea
                    id={id("notes")}
                    rows={5}
                    placeholder={custom ? builder.notesPlaceholderCustom : fields.descriptionPlaceholder}
                    value={d.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    aria-invalid={!!errors.notes}
                    className={`${inputBase} resize-y leading-normal ${errors.notes ? "border-danger" : "border-line-strong"}`}
                  />
                </Field>
              </div>
            </div>
            <p className="mt-4 text-[14px] text-muted">{fields.filesNote}</p>
          </section>
        </div>

        {/* Summary */}
        <aside aria-label={startPage.estimateLabel} className="lg:sticky lg:top-[104px] lg:self-start">
          <div className="rounded-[28px] bg-sheet p-6 text-sheet-fg sm:p-7">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.14em] text-sheet-muted">{startPage.estimateLabel}</h2>
            <div aria-live="polite" className="mt-4">
              {!itemSlug ? (
                <p className="font-display text-[28px] leading-tight text-sheet-muted">{startPage.estimateEmptyPrice}</p>
              ) : custom ? (
                <>
                  <p className="font-display text-[34px] leading-tight">{builder.quoteLabel}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-sheet-muted">{builder.quoteNote}</p>
                </>
              ) : (
                <>
                  <ul className="flex flex-col gap-2.5 border-b border-sheet-line pb-4 text-[14px]">
                    {estimate.lines.map((l) => (
                      <li key={l.label} className="flex justify-between gap-4">
                        <span className="text-sheet-muted">{l.label}</span>
                        <span className="whitespace-nowrap">
                          {formatINR(l.amount)}
                          {l.recurring && "/mo"}
                        </span>
                      </li>
                    ))}
                    {estimate.speedFee > 0 && (
                      <li className="flex justify-between gap-4">
                        <span className="text-sheet-muted">{speedInfo.label} delivery</span>
                        <span>{formatINR(estimate.speedFee)}</span>
                      </li>
                    )}
                  </ul>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <span className="text-[15px] text-sheet-muted">{builder.totalLabel}</span>
                    <m.span
                      key={estimate.total}
                      initial={{ opacity: 0.4, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease }}
                      className="font-display text-[40px] leading-none"
                    >
                      {formatINR(estimate.total)}
                    </m.span>
                  </div>
                  {estimate.monthly > 0 && (
                    <p className="mt-1 text-right text-[14px] text-sheet-muted">
                      + {formatINR(estimate.monthly)} {builder.perMonth}
                    </p>
                  )}
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-[14px]">
                    <div className="rounded-2xl bg-white/6 p-3">
                      <dt className="text-sheet-muted">{policies.advancePercent}% {builder.toStart}</dt>
                      <dd className="mt-1 text-[17px] font-semibold">{formatINR(estimate.advance)}</dd>
                    </div>
                    <div className="rounded-2xl bg-white/6 p-3">
                      <dt className="text-sheet-muted">{builder.onDelivery}</dt>
                      <dd className="mt-1 text-[17px] font-semibold">{formatINR(estimate.balance)}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-[13px] leading-relaxed text-sheet-muted">{builder.estimateNote}</p>
                </>
              )}
            </div>
            <button type="submit" disabled={sending} className="btn btn-primary mt-6 hidden w-full disabled:opacity-70 lg:inline-flex">
              <Send className="size-[18px]" aria-hidden />
              {sending ? startPage.sendingLabel : startPage.submitLabel}
            </button>
          </div>
        </aside>

        {/* Mobile: sticky total + send */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-[640px] items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[12px] text-faint">{startPage.estimateLabel}</p>
              <p className="truncate font-display text-[24px] leading-tight">
                {!itemSlug ? startPage.estimateEmptyPrice : custom ? builder.quoteLabel : formatINR(estimate.total)}
              </p>
            </div>
            <button type="submit" disabled={sending} className="btn btn-primary shrink-0 disabled:opacity-70">
              <Send className="size-[18px]" aria-hidden />
              {builder.sendShort}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-label">
        {label} {required && <span className="text-accent-text" aria-hidden>*</span>}
      </label>
      {children}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function FieldError({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={`flex items-center gap-1.5 text-sm text-danger ${className}`}>
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
