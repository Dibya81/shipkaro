"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { m } from "motion/react";
import { CircleAlert, MessageCircle, Paperclip, Send } from "lucide-react";
import { services, somethingElse, startPage, type Service } from "@/config/site";
import { whatsappLink } from "@/lib/whatsapp";

const ALL_SERVICES: Service[] = [...services, somethingElse];
const WEBHOOK = process.env.NEXT_PUBLIC_SHEETS_WEBHOOK;
const { fields, errors: errorText } = startPage;

type FormValues = {
  service: string;
  name: string;
  phone: string;
  org: string;
  deadline: string;
  description: string;
};
type Errors = Partial<Record<"service" | "name" | "phone" | "description", string>>;
type Status = "idle" | "sending" | "sent";

function findService(slug: string | null | undefined) {
  return ALL_SERVICES.find((s) => s.slug === slug);
}

function validate(v: FormValues): Errors {
  const e: Errors = {};
  if (!findService(v.service)) e.service = errorText.service;
  if (v.name.trim().length < 2) e.name = errorText.name;
  const digits = v.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) e.phone = errorText.phone;
  if (v.description.trim().length < 10) e.description = errorText.description;
  return e;
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

function buildMessage(v: FormValues) {
  const s = findService(v.service)!;
  return [
    `*${startPage.messageTitle}*`,
    "",
    `*Service:* ${s.title} (${s.price})`,
    `*Name:* ${v.name.trim()}`,
    `*WhatsApp:* ${v.phone.trim()}`,
    `*${fields.org}:* ${v.org.trim() || "-"}`,
    `*${fields.deadline}:* ${formatDate(v.deadline) || "Flexible"}`,
    "",
    "*Project details:*",
    v.description.trim(),
  ].join("\n");
}

/** Optional: log the request to a Google Sheet. Never blocks WhatsApp for more than 4s. */
async function postToSheet(v: FormValues) {
  if (!WEBHOOK) return;
  const s = findService(v.service);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    // text/plain + no-cors avoids a CORS preflight, which Apps Script can't answer.
    await fetch(WEBHOOK, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        submittedAt: new Date().toISOString(),
        service: s?.title ?? v.service,
        serviceSlug: v.service,
        price: s?.price ?? "",
        name: v.name.trim(),
        phone: v.phone.trim(),
        org: v.org.trim(),
        deadline: v.deadline,
        description: v.description.trim(),
        page: window.location.href,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    // WhatsApp is the source of truth, so a failed sheet write must not block it.
    console.warn("Sheets webhook failed", err);
  } finally {
    clearTimeout(timer);
  }
}

const inputBase =
  "min-h-12 w-full rounded-xl border bg-bg px-4 py-3.5 text-base text-fg placeholder:text-placeholder transition-colors focus:border-accent-strong focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong";

const noopSubscribe = () => () => {};
const readServiceParam = () => new URLSearchParams(window.location.search).get("service");

export function StartProject() {
  const uid = useId();
  // ?service=<slug> preselects a pill. Read in the browser only, so the page stays a
  // single static tree (no Suspense swap, no remount after hydration).
  const urlService = useSyncExternalStore(noopSubscribe, readServiceParam, () => null);
  const [picked, setValues] = useState<FormValues>({
    service: "",
    name: "",
    phone: "",
    org: "",
    deadline: "",
    description: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [sentUrl, setSentUrl] = useState("");

  // A pill the visitor clicks wins over the one from the URL.
  const values: FormValues = {
    ...picked,
    service: picked.service || findService(urlService)?.slug || "",
  };
  const selected = findService(values.service);
  const id = (name: string) => `${uid}-${name}`;

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key as keyof Errors]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function pickService(slug: string) {
    update("service", slug);
    // Keep the URL shareable: /start?service=<slug>
    window.history.replaceState(null, "", `?service=${slug}`);
  }

  async function submit() {
    const found = validate(values);
    setErrors(found);
    const firstInvalid = (["service", "name", "phone", "description"] as const).find((k) => found[k]);
    if (firstInvalid) {
      const el = document.getElementById(id(firstInvalid === "service" ? "service-group" : firstInvalid));
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    const url = whatsappLink(buildMessage(values));
    setStatus("sending");

    if (WEBHOOK) {
      // Open the tab inside the click so popup blockers allow it, then send it to
      // WhatsApp once the sheet write finishes. Same-tab fallback if it was blocked.
      const win = window.open("", "_blank");
      await postToSheet(values);
      if (win && !win.closed) {
        win.opener = null;
        win.location.href = url;
      } else {
        window.location.href = url;
      }
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    setSentUrl(url);
    setStatus("sent");
  }

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="container-page grid gap-14 pb-24 pt-14 sm:pt-[72px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
      {/* Left: heading + live estimate */}
      <div className="flex flex-col gap-7 lg:sticky lg:top-[108px] lg:self-start">
        <span className="text-[13px] font-semibold uppercase tracking-[0.1em] text-accent-text">
          {startPage.eyebrow}
        </span>
        <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-none tracking-[-0.04em]">
          {startPage.heading}
        </h1>
        <p className="text-[17px] leading-relaxed text-muted">{startPage.subtext}</p>

        <section
          aria-labelledby={id("estimate")}
          aria-live="polite"
          className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-card p-6"
        >
          <h2 id={id("estimate")} className="text-[13px] uppercase tracking-[0.08em] text-faint">
            {startPage.estimateLabel}
          </h2>
          <m.div
            key={selected?.slug ?? "none"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3.5"
          >
            <span
              className={
                "font-display tracking-[-0.03em] " +
                (selected
                  ? "text-[clamp(34px,4vw,44px)] leading-none text-accent-strong"
                  : "text-[28px] leading-tight text-soft")
              }
            >
              {selected ? selected.price : startPage.estimateEmptyPrice}
            </span>
            {selected && <span className="text-[15px] text-soft">{selected.title}</span>}
            <span className="text-sm leading-relaxed text-muted">
              {selected ? selected.description : startPage.estimateEmptyNote}
            </span>
          </m.div>
        </section>
      </div>

      {/* Right: form */}
      <div className="min-w-0 rounded-3xl border border-line bg-card p-5 sm:p-8 lg:p-10">
        {status === "sent" ? (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start gap-5 py-6"
            role="status"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-success-bg">
              <MessageCircle className="size-6 text-success" aria-hidden />
            </span>
            <h2 className="font-display text-3xl tracking-[-0.03em]">{startPage.success.heading}</h2>
            <p className="max-w-[46ch] leading-relaxed text-muted">{startPage.success.body}</p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a href={sentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <MessageCircle className="size-5" aria-hidden />
                {startPage.success.retry}
              </a>
              <button type="button" onClick={() => setStatus("idle")} className="btn btn-ghost">
                {startPage.success.reset}
              </button>
            </div>
          </m.div>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="flex flex-col gap-7">
            {errorCount > 0 && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
              >
                <CircleAlert className="size-4 shrink-0" aria-hidden />
                Please fix {errorCount === 1 ? "1 field" : `${errorCount} fields`} below.
              </p>
            )}

            <fieldset
              id={id("service-group")}
              tabIndex={-1}
              aria-describedby={errors.service ? id("service-error") : undefined}
              className="flex flex-col focus:outline-none"
            >
              <legend className="mb-3.5 text-[15px] font-semibold">
                {fields.service} <span className="text-accent-text" aria-hidden>*</span>
              </legend>
              <div className="flex flex-wrap gap-2.5">
                {ALL_SERVICES.map((s) => (
                  <label
                    key={s.slug}
                    className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-line-strong bg-bg px-4 py-2.5 text-[15px] font-medium text-label transition-colors hover:border-faint has-checked:border-accent has-checked:bg-accent has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-strong"
                  >
                    <input
                      type="radio"
                      name="service"
                      value={s.slug}
                      checked={values.service === s.slug}
                      onChange={() => pickService(s.slug)}
                      className="sr-only"
                    />
                    {s.slug === somethingElse.slug ? "Something else" : s.title}
                  </label>
                ))}
              </div>
              {errors.service && (
                <FieldError id={id("service-error")} className="mt-3">
                  {errors.service}
                </FieldError>
              )}
            </fieldset>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label={fields.name} htmlFor={id("name")} required error={errors.name} errorId={id("name-error")}>
                <input
                  id={id("name")}
                  type="text"
                  autoComplete="name"
                  placeholder={fields.namePlaceholder}
                  value={values.name}
                  onChange={(e) => update("name", e.target.value)}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? id("name-error") : undefined}
                  aria-required
                  className={`${inputBase} ${errors.name ? "border-danger" : "border-line-strong"}`}
                />
              </Field>
              <Field label={fields.phone} htmlFor={id("phone")} required error={errors.phone} errorId={id("phone-error")}>
                <input
                  id={id("phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={fields.phonePlaceholder}
                  value={values.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? id("phone-error") : undefined}
                  aria-required
                  className={`${inputBase} ${errors.phone ? "border-danger" : "border-line-strong"}`}
                />
              </Field>
              <Field label={fields.org} htmlFor={id("org")}>
                <input
                  id={id("org")}
                  type="text"
                  autoComplete="organization"
                  placeholder={fields.orgPlaceholder}
                  value={values.org}
                  onChange={(e) => update("org", e.target.value)}
                  className={`${inputBase} border-line-strong`}
                />
              </Field>
              <Field label={fields.deadline} htmlFor={id("deadline")}>
                <input
                  id={id("deadline")}
                  type="date"
                  value={values.deadline}
                  onFocus={(e) => (e.currentTarget.min = new Date().toISOString().slice(0, 10))}
                  onChange={(e) => update("deadline", e.target.value)}
                  className={`${inputBase} border-line-strong`}
                />
              </Field>
            </div>

            <Field
              label={fields.description}
              htmlFor={id("description")}
              required
              error={errors.description}
              errorId={id("description-error")}
            >
              <textarea
                id={id("description")}
                rows={5}
                placeholder={fields.descriptionPlaceholder}
                value={values.description}
                onChange={(e) => update("description", e.target.value)}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? id("description-error") : undefined}
                aria-required
                className={`${inputBase} resize-y leading-normal ${errors.description ? "border-danger" : "border-line-strong"}`}
              />
            </Field>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-label">{fields.files}</span>
              <p className="flex items-start gap-3 rounded-xl border border-dashed border-line-strong bg-bg px-4 py-[18px] text-[15px] leading-relaxed text-muted">
                <Paperclip className="mt-0.5 size-[18px] shrink-0 text-faint" aria-hidden />
                {fields.filesNote}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted">{startPage.footnote}</span>
              <button type="submit" disabled={status === "sending"} className="btn btn-primary disabled:opacity-70">
                <Send className="size-[18px]" aria-hidden />
                {status === "sending" ? startPage.sendingLabel : startPage.submitLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  errorId,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-label">
        {label} {required && <span className="text-accent-text" aria-hidden>*</span>}
      </label>
      {children}
      {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, className = "", children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <p id={id} className={`flex items-center gap-1.5 text-sm text-danger ${className}`}>
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
