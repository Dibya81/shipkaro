"use client";

import { useState } from "react";
import { Download, Plus, Table2, Trash2 } from "lucide-react";
import {
  addExpense,
  deleteExpense,
  deletePayment,
  EXPENSE_CATEGORIES,
  paidFor,
  PAY_KINDS,
  today,
  useDB,
  useHydrated,
  type DB,
  type ExpenseCategory,
} from "@/lib/store";
import {
  Badge,
  btnSm,
  compact,
  daysUntil,
  downloadCsv,
  EmptyState,
  fmtDate,
  inputCls,
  Kpi,
  money,
  PageHeader,
  Panel,
} from "@/components/admin/ui";
import { PaymentForm } from "@/components/admin/views";

/* ------------------------------------------------------------------ */
/* Periods                                                             */
/* ------------------------------------------------------------------ */

const PERIODS = [
  { id: "month", label: "This month" },
  { id: "3m", label: "Last 3 months" },
  { id: "6m", label: "Last 6 months" },
  { id: "fy", label: "This financial year" },
  { id: "all", label: "All time" },
] as const;
type PeriodId = (typeof PERIODS)[number]["id"];

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (key: string) =>
  new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(`${key}-01T00:00:00`));

/** First day (YYYY-MM-DD) included in the period, or "" for all time. */
function periodStart(p: PeriodId) {
  const now = new Date();
  const first = (y: number, m: number) => ym(new Date(y, m, 1)) + "-01";
  if (p === "month") return first(now.getFullYear(), now.getMonth());
  if (p === "3m") return first(now.getFullYear(), now.getMonth() - 2);
  if (p === "6m") return first(now.getFullYear(), now.getMonth() - 5);
  if (p === "fy") {
    // Indian financial year runs 1 April to 31 March
    const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return first(y, 3);
  }
  return "";
}

/** Month keys shown on the chart: at least 6, ending this month. */
function chartMonths(p: PeriodId, db: DB) {
  const now = new Date();
  let count = 6;
  if (p === "fy") count = Math.max(6, ((now.getMonth() - 3 + 12) % 12) + 1);
  if (p === "all") {
    const dates = [...db.payments.map((x) => x.date), ...db.expenses.map((x) => x.date)].sort();
    if (dates[0]) {
      const f = new Date(`${dates[0]}T00:00:00`);
      count = Math.min(12, Math.max(6, (now.getFullYear() - f.getFullYear()) * 12 + now.getMonth() - f.getMonth() + 1));
    }
  }
  return Array.from({ length: count }, (_, i) => ym(new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1)));
}

/* ------------------------------------------------------------------ */
/* Finance page                                                        */
/* ------------------------------------------------------------------ */

export function FinanceView() {
  const db = useDB();
  const ready = useHydrated();
  const [period, setPeriod] = useState<PeriodId>("6m");
  if (!ready) return null;

  const start = periodStart(period);
  const inRange = (d: string) => !start || d >= start;
  const payments = db.payments.filter((p) => inRange(p.date));
  const expenses = db.expenses.filter((e) => inRange(e.date));
  const collected = payments.reduce((s, p) => s + p.amount, 0);
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = collected - spent;
  const margin = collected ? Math.round((profit / collected) * 100) : 0;
  const outstanding = db.projects.reduce((s, p) => s + Math.max(0, p.agreedPrice - paidFor(db, p.id)), 0);
  const recurring = db.payments.filter((p) => p.kind === "maintenance" && inRange(p.date)).reduce((s, p) => s + p.amount, 0);

  function exportCsv() {
    const proj = new Map(db.projects.map((p) => [p.id, p]));
    downloadCsv(`shipkaro-finance-${today()}.csv`, [
      ["Type", "Date", "Amount (INR)", "Project / Category", "Client", "Method / Note"],
      ...payments.map((p) => [
        `Income: ${PAY_KINDS.find((k) => k.id === p.kind)?.label ?? p.kind}`,
        p.date,
        p.amount,
        proj.get(p.projectId)?.title ?? "",
        proj.get(p.projectId)?.client ?? "",
        [p.method, p.note].filter(Boolean).join(" · "),
      ]),
      ...expenses.map((e) => ["Expense", e.date, -e.amount, e.category, "", e.note]),
    ]);
  }

  return (
    <>
      <PageHeader title="Finance" sub="Money in, money out, and what clients still owe you.">
        <label className="sr-only" htmlFor="period">
          Period
        </label>
        <select id="period" value={period} onChange={(e) => setPeriod(e.target.value as PeriodId)} className={inputCls.replace("w-full", "w-auto")}>
          {PERIODS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={exportCsv} className={btnSm + " border border-line-strong hover:border-faint"}>
          <Download className="size-4" aria-hidden /> Export CSV
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Collected" value={money(collected)} note={recurring ? `${money(recurring)} from maintenance` : `${payments.length} payments`} />
        <Kpi label="Spent" value={money(spent)} note={`${expenses.length} expenses`} />
        <Kpi
          label="Net profit"
          value={money(profit)}
          note={collected ? `${margin}% margin` : "No income yet"}
          tone={profit > 0 ? "good" : profit < 0 ? "bad" : undefined}
        />
        <Kpi label="Still to collect" value={money(outstanding)} note="Across all projects" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <CashflowChart db={db} months={chartMonths(period, db)} />
        <ExpenseBreakdown expenses={expenses} />
      </div>

      <div className="mt-6">
        <Receivables db={db} />
      </div>

      <div className="mt-6">
        <Ledger db={db} start={start} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Cash flow: collected vs spent per month (grouped bars)              */
/* ------------------------------------------------------------------ */

function CashflowChart({ db, months }: { db: DB; months: string[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const rows = months.map((m) => ({
    key: m,
    label: monthLabel(m),
    income: db.payments.filter((p) => p.date.startsWith(m)).reduce((s, p) => s + p.amount, 0),
    spend: db.expenses.filter((e) => e.date.startsWith(m)).reduce((s, e) => s + e.amount, 0),
  }));
  const max = Math.max(1, ...rows.flatMap((r) => [r.income, r.spend]));
  // Nice round top for the axis
  const step = 10 ** Math.floor(Math.log10(max));
  const top = Math.ceil(max / step) * step;
  const ticks = [0, 0.5, 1].map((f) => Math.round(top * f));

  return (
    <Panel
      title="Cash flow by month"
      action={
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          aria-pressed={asTable}
          className={btnSm + " min-h-9 px-2.5 text-muted hover:bg-raised hover:text-fg"}
        >
          <Table2 className="size-4" aria-hidden /> {asTable ? "Chart" : "Table"}
        </button>
      }
    >
      <div className="mb-4 flex gap-5 text-[13px] text-soft">
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-[3px] bg-viz-in" /> Collected
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-[3px] bg-viz-out" /> Spent
        </span>
      </div>

      {asTable ? (
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left text-[13px] text-muted">
              <th className="py-2 font-medium">Month</th>
              <th className="py-2 text-right font-medium">Collected</th>
              <th className="py-2 text-right font-medium">Spent</th>
              <th className="py-2 text-right font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-line">
                <td className="py-2">{r.label}</td>
                <td className="py-2 text-right">{money(r.income)}</td>
                <td className="py-2 text-right">{money(r.spend)}</td>
                <td className={"py-2 text-right " + (r.income - r.spend < 0 ? "text-danger" : "")}>{money(r.income - r.spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative pl-12" role="img" aria-label="Collected and spent per month. Switch to table for exact values.">
          {/* grid + y axis */}
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 bottom-7">
            {ticks.map((t) => (
              <div
                key={t}
                className="absolute inset-x-0 flex items-center"
                style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}
              >
                <span className="w-11 pr-2 text-right text-[11px] text-faint">{compact(t)}</span>
                <span className={"h-px flex-1 " + (t === 0 ? "bg-line-strong" : "bg-line")} />
              </div>
            ))}
          </div>
          <div className="relative flex h-[240px] items-stretch gap-1 pb-7">
            {rows.map((r, i) => (
              <div
                key={r.key}
                className="relative flex flex-1 flex-col"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${r.label}: collected ${money(r.income)}, spent ${money(r.spend)}`}
              >
                <div className={"flex flex-1 items-end justify-center gap-[2px] rounded-md transition-colors " + (hover === i ? "bg-raised" : "")}>
                  <span className="w-[28%] max-w-[22px] rounded-t-[4px] bg-viz-in" style={{ height: `${(r.income / top) * 100}%` }} />
                  <span className="w-[28%] max-w-[22px] rounded-t-[4px] bg-viz-out" style={{ height: `${(r.spend / top) * 100}%` }} />
                </div>
                <span className="absolute inset-x-0 -bottom-6 text-center text-[12px] text-muted">{r.label}</span>
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-xl border border-line bg-bg px-3 py-2 text-[13px] shadow-[0_10px_30px_-12px_rgb(0_0_0/0.35)]">
                    <p className="font-medium">{r.label}</p>
                    <p className="mt-1 flex items-center gap-2">
                      <span aria-hidden className="size-2 rounded-[2px] bg-viz-in" /> Collected {money(r.income)}
                    </p>
                    <p className="flex items-center gap-2">
                      <span aria-hidden className="size-2 rounded-[2px] bg-viz-out" /> Spent {money(r.spend)}
                    </p>
                    <p className="mt-1 border-t border-line pt-1 text-muted">Net {money(r.income - r.spend)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Where the money went                                                */
/* ------------------------------------------------------------------ */

function ExpenseBreakdown({ expenses }: { expenses: DB["expenses"] }) {
  const byCat = EXPENSE_CATEGORIES.map((c) => ({
    c,
    v: expenses.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
  }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v);
  const max = Math.max(1, ...byCat.map((x) => x.v));
  const total = byCat.reduce((s, x) => s + x.v, 0);

  return (
    <Panel title="Where the money went">
      {byCat.length === 0 ? (
        <p className="text-[15px] text-muted">No expenses in this period.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {byCat.map((x) => (
            <li key={x.c}>
              <div className="mb-1.5 flex justify-between gap-3 text-[14px]">
                <span>{x.c}</span>
                <span className="text-soft">
                  {money(x.v)} <span className="text-faint">· {Math.round((x.v / total) * 100)}%</span>
                </span>
              </div>
              <div className="h-2.5 rounded-r-[4px] bg-viz-out" style={{ width: `${Math.max(2, (x.v / max) * 100)}%` }} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Receivables: who still owes money                                   */
/* ------------------------------------------------------------------ */

function Receivables({ db }: { db: DB }) {
  const rows = db.projects
    .map((p) => {
      const paid = paidFor(db, p.id);
      return { p, paid, due: Math.max(0, p.agreedPrice - paid) };
    })
    .filter((r) => r.due > 0)
    .sort((a, b) => a.p.dueDate.localeCompare(b.p.dueDate));

  return (
    <Panel title="Still to collect">
      {rows.length === 0 ? (
        <p className="text-[15px] text-muted">Every project is fully paid.</p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[640px] text-[14px]">
            <thead>
              <tr className="text-left text-[13px] text-muted">
                <th className="px-2 py-2 font-medium">Project</th>
                <th className="px-2 py-2 text-right font-medium">Agreed</th>
                <th className="px-2 py-2 text-right font-medium">Received</th>
                <th className="px-2 py-2 text-right font-medium">To collect</th>
                <th className="px-2 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, paid, due }) => {
                const d = daysUntil(p.dueDate);
                const status =
                  paid === 0
                    ? { t: "Awaiting advance", tone: "new" }
                    : p.stage === "delivered" || d < 0
                      ? { t: d < 0 ? `Balance overdue ${-d}d` : "Balance due", tone: "overdue" }
                      : { t: "Advance received", tone: "neutral" };
                return (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-2 py-3">
                      <p className="font-medium">{p.title}</p>
                      <p className="text-[13px] text-muted">{p.client}</p>
                    </td>
                    <td className="px-2 py-3 text-right">{money(p.agreedPrice)}</td>
                    <td className="px-2 py-3 text-right">{money(paid)}</td>
                    <td className="px-2 py-3 text-right font-semibold">{money(due)}</td>
                    <td className="px-2 py-3">
                      <Badge tone={status.tone}>{status.t}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Ledger: payments and expenses, with quick add                       */
/* ------------------------------------------------------------------ */

function Ledger({ db, start }: { db: DB; start: string }) {
  const [tab, setTab] = useState<"payments" | "expenses">("payments");
  const [adding, setAdding] = useState(false);
  const proj = new Map(db.projects.map((p) => [p.id, p]));
  const payments = db.payments.filter((p) => !start || p.date >= start).sort((a, b) => b.date.localeCompare(a.date));
  const expenses = db.expenses.filter((e) => !start || e.date >= start).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Panel
      title="Ledger"
      action={
        <button type="button" onClick={() => setAdding((v) => !v)} className={btnSm + " bg-fg text-bg"}>
          <Plus className="size-4" aria-hidden /> {tab === "payments" ? "Add payment" : "Add expense"}
        </button>
      }
    >
      <div role="tablist" className="mb-4 flex gap-2">
        {(["payments", "expenses"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t);
              setAdding(false);
            }}
            className={
              "min-h-9 rounded-full border px-3.5 text-[14px] capitalize transition-colors " +
              (tab === t ? "border-fg bg-fg text-bg" : "border-line-strong text-soft hover:text-fg")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {adding &&
        (tab === "payments" ? (
          db.projects.length ? (
            <div className="mb-4">
              <PaymentForm projects={db.projects} onDone={() => setAdding(false)} />
            </div>
          ) : (
            <p className="mb-4 text-[14px] text-muted">Add a project first, then record its payments.</p>
          )
        ) : (
          <ExpenseForm onDone={() => setAdding(false)} />
        ))}

      {tab === "payments" ? (
        payments.length === 0 ? (
          <EmptyState title="No payments yet" body="Record advances and balances here to see income and what is still owed." />
        ) : (
          <ul className="divide-y divide-line">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{proj.get(p.projectId)?.title ?? "Deleted project"}</p>
                  <p className="truncate text-[13px] text-muted">
                    {fmtDate(p.date)} · {PAY_KINDS.find((k) => k.id === p.kind)?.label} · {p.method}
                    {p.note && ` · ${p.note}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[15px] font-semibold text-success">+{money(p.amount)}</span>
                  <button
                    type="button"
                    aria-label="Delete payment"
                    onClick={() => confirm("Delete this payment?") && deletePayment(p.id)}
                    className={btnSm + " min-h-9 px-2 text-faint hover:bg-danger/10 hover:text-danger"}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : expenses.length === 0 ? (
        <EmptyState title="No expenses yet" body="Log hosting, tools, freelancers and ads to see your real profit." />
      ) : (
        <ul className="divide-y divide-line">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium">{e.note || e.category}</p>
                <p className="truncate text-[13px] text-muted">
                  {fmtDate(e.date)} · {e.category}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[15px] font-semibold">-{money(e.amount)}</span>
                <button
                  type="button"
                  aria-label="Delete expense"
                  onClick={() => confirm("Delete this expense?") && deleteExpense(e.id)}
                  className={btnSm + " min-h-9 px-2 text-faint hover:bg-danger/10 hover:text-danger"}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState<ExpenseCategory>("Software & tools");
  const [note, setNote] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(amount);
        if (!n) return;
        addExpense({ amount: n, date, category, note: note.trim() });
        onDone();
      }}
      className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-line bg-bg p-3 lg:grid-cols-5 lg:items-end"
    >
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        Amount (₹)
        <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className={inputCls} required />
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        Category
        <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={inputCls}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        What for
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="Figma, domain, ads..." />
      </label>
      <button type="submit" className={btnSm + " col-span-2 bg-fg text-bg lg:col-span-1"}>
        Save expense
      </button>
    </form>
  );
}
