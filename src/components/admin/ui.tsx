"use client";

import { formatINR } from "@/config/pricing";

/** Shared building blocks for the admin screens. */

export const money = formatINR;

const compactFmt = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
export const compact = (n: number) => `₹${compactFmt.format(n)}`;

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
export function fmtDate(iso: string) {
  if (!iso) return "-";
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return dateFmt.format(d);
}

/** Whole days from today to an ISO date (negative = in the past). */
export function daysUntil(iso: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(`${iso}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** True when an ISO date-time falls within the last n days. */
export function withinLastDays(iso: string, n: number) {
  return Date.now() - new Date(iso).getTime() <= n * 86_400_000;
}

export function relativeDay(iso: string) {
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[clamp(36px,4vw,52px)] leading-none tracking-[-0.02em]">{title}</h1>
        {sub && <p className="mt-2 text-[15px] text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  className = "",
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={"rounded-[22px] border border-line bg-card p-5 sm:p-6 " + className}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-[22px] border border-line bg-card p-5">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-2 font-display text-[32px] leading-none tracking-[-0.01em]">{value}</p>
      {note && (
        <p
          className={
            "mt-2 text-[13px] " + (tone === "good" ? "text-success" : tone === "bad" ? "text-danger" : "text-faint")
          }
        >
          {note}
        </p>
      )}
    </div>
  );
}

const BADGE: Record<string, string> = {
  new: "bg-accent-wash text-accent-text border-accent-line",
  contacted: "bg-raised text-soft border-line-strong",
  quoted: "bg-raised text-soft border-line-strong",
  won: "bg-success-bg text-success border-transparent",
  lost: "bg-raised text-faint border-line",
  overdue: "bg-danger/10 text-danger border-danger/30",
  paid: "bg-success-bg text-success border-transparent",
  neutral: "bg-raised text-soft border-line",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE | string; children: React.ReactNode }) {
  return (
    <span className={"inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium " + (BADGE[tone] ?? BADGE.neutral)}>
      {children}
    </span>
  );
}

export const inputCls =
  "min-h-10 w-full rounded-[10px] border border-line-strong bg-bg px-3 py-2 text-[14px] text-fg placeholder:text-placeholder focus:border-accent-strong focus:outline-none";

export const btnSm =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[10px] px-3.5 text-[14px] font-medium transition-colors";

export function EmptyState({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[22px] border border-dashed border-line-strong px-6 py-14 text-center">
      <p className="font-display text-[26px] leading-tight">{title}</p>
      <p className="mt-2 max-w-[44ch] text-[15px] text-muted">{body}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/** Builds a wa.me link for a client's number (keeps digits, assumes India when 10 digits). */
export function clientWhatsApp(phone: string, text = "") {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
