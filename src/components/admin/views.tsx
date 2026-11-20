"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronDown, Mail, MessageCircle, Plus, Trash2 } from "lucide-react";
import {
  addPayment,
  addProject,
  convertToProject,
  deleteProject,
  deleteRequest,
  paidFor,
  PAY_KINDS,
  PAY_METHODS,
  PROJECT_STAGES,
  REQUEST_STATUSES,
  setRequestStatus,
  today,
  updateProject,
  useDB,
  useHydrated,
  type PayKind,
  type PayMethod,
  type Project,
  type ProjectRequest,
  type ProjectStage,
  type RequestStatus,
} from "@/lib/store";
import {
  Badge,
  btnSm,
  clientWhatsApp,
  daysUntil,
  EmptyState,
  fmtDate,
  inputCls,
  Kpi,
  money,
  PageHeader,
  Panel,
  relativeDay,
  withinLastDays,
} from "@/components/admin/ui";

const OPEN: RequestStatus[] = ["new", "contacted", "quoted"];

function dueLabel(p: Project) {
  if (p.stage === "delivered") return { text: "Delivered", tone: "paid" };
  const d = daysUntil(p.dueDate);
  if (d < 0) return { text: `${-d} days late`, tone: "overdue" };
  if (d === 0) return { text: "Due today", tone: "new" };
  return { text: `Due in ${d} days`, tone: "neutral" };
}

/* ================================================================== */
/* Overview                                                            */
/* ================================================================== */

export function Overview() {
  const db = useDB();
  const ready = useHydrated();
  if (!ready) return null;

  const newThisWeek = db.requests.filter((r) => withinLastDays(r.createdAt, 7)).length;
  const open = db.requests.filter((r) => OPEN.includes(r.status));
  const pipeline = open.reduce((s, r) => s + (r.estimate.custom ? 0 : r.estimate.total), 0);
  const decided = db.requests.filter((r) => r.status === "won" || r.status === "lost");
  const winRate = decided.length ? Math.round((db.requests.filter((r) => r.status === "won").length / decided.length) * 100) : 0;
  const monthKey = today().slice(0, 7);
  const collectedMonth = db.payments.filter((p) => p.date.startsWith(monthKey)).reduce((s, p) => s + p.amount, 0);
  const active = db.projects.filter((p) => p.stage !== "delivered");
  const outstanding = db.projects.reduce((s, p) => s + Math.max(0, p.agreedPrice - paidFor(db, p.id)), 0);

  return (
    <>
      <PageHeader title="Overview" sub="What needs you today, and how the business is doing." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="New requests, last 7 days" value={String(newThisWeek)} note={`${open.length} still open`} />
        <Kpi label="Open pipeline" value={money(pipeline)} note="Estimates of open requests" />
        <Kpi label="Collected this month" value={money(collectedMonth)} note={`Win rate ${winRate}%`} />
        <Kpi label="Still to collect" value={money(outstanding)} note={`${active.length} active projects`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel
          title="Requests to answer"
          action={
            <Link href="/admin/requests" className="-my-2 flex min-h-11 items-center gap-1 text-[14px] text-muted hover:text-fg">
              All requests <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        >
          {open.length === 0 ? (
            <p className="text-[15px] text-muted">Nothing waiting. New requests from the website show up here.</p>
          ) : (
            <ul className="divide-y divide-line">
              {open.slice(0, 6).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium">
                      {r.name}
                      {r.org && <span className="text-muted">, {r.org}</span>}
                    </p>
                    <p className="truncate text-[13px] text-muted">
                      {r.itemTitle} · {relativeDay(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[14px] font-medium">{r.estimate.custom ? "Quote" : money(r.estimate.total)}</span>
                    <Badge tone={r.status}>{REQUEST_STATUSES.find((s) => s.id === r.status)?.label}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Active projects"
          action={
            <Link href="/admin/projects" className="-my-2 flex min-h-11 items-center gap-1 text-[14px] text-muted hover:text-fg">
              All projects <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        >
          {active.length === 0 ? (
            <p className="text-[15px] text-muted">No active projects. Mark a request as won to start one.</p>
          ) : (
            <ul className="divide-y divide-line">
              {[...active]
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .map((p) => {
                  const due = dueLabel(p);
                  const paid = paidFor(db, p.id);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium">{p.title}</p>
                        <p className="truncate text-[13px] text-muted">
                          {p.client} · {PROJECT_STAGES.find((s) => s.id === p.stage)?.label}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge tone={due.tone}>{due.text}</Badge>
                        <span className="text-[12px] text-muted">
                          {money(paid)} of {money(p.agreedPrice)}
                        </span>
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

/* ================================================================== */
/* Requests                                                            */
/* ================================================================== */

export function RequestsView() {
  const db = useDB();
  const ready = useHydrated();
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  if (!ready) return null;

  const list = db.requests.filter((r) => filter === "all" || r.status === filter);
  const count = (s: RequestStatus) => db.requests.filter((r) => r.status === s).length;

  return (
    <>
      <PageHeader title="Requests" sub="Everything sent from the Start a project page, with the price they saw." />
      <div role="tablist" aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2">
        {[{ id: "all" as const, label: "All", n: db.requests.length }, ...REQUEST_STATUSES.map((s) => ({ ...s, n: count(s.id) }))].map(
          (t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={filter === t.id}
              onClick={() => setFilter(t.id)}
              className={
                "min-h-10 rounded-full border px-3.5 text-[14px] transition-colors " +
                (filter === t.id ? "border-fg bg-fg text-bg" : "border-line-strong text-soft hover:text-fg")
              }
            >
              {t.label} <span className="opacity-60">{t.n}</span>
            </button>
          ),
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No requests here"
          body="When someone sends a project from the website, it appears in this list with their selections and estimate."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((r) => (
            <RequestRow key={r.id} r={r} />
          ))}
        </ul>
      )}
    </>
  );
}

function RequestRow({ r }: { r: ProjectRequest }) {
  const [open, setOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [price, setPrice] = useState(String(r.estimate.total || ""));
  const [due, setDue] = useState(r.deadline || "");

  return (
    <li className="rounded-[20px] border border-line bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div className="min-w-0">
          <p className="text-[16px] font-medium">
            {r.name}
            {r.org && <span className="font-normal text-muted">, {r.org}</span>}
          </p>
          <p className="mt-0.5 text-[14px] text-muted">
            {r.itemTitle} · {relativeDay(r.createdAt)}
            {r.deadline && ` · deadline ${fmtDate(r.deadline)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-[22px]">{r.estimate.custom ? "Custom quote" : money(r.estimate.total)}</span>
          <Badge tone={r.status}>{REQUEST_STATUSES.find((s) => s.id === r.status)?.label}</Badge>
          <ChevronDown aria-hidden className={"size-5 text-faint transition-transform " + (open ? "rotate-180" : "")} />
        </div>
      </button>

      {open && (
        <div className="grid gap-6 border-t border-line p-4 sm:p-5 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            {r.estimate.custom ? (
              <p className="text-[15px]">
                <span className="text-muted">Budget:</span> {r.budget || "Not given"}
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-[14px]">
                {r.estimate.lines.map((l) => (
                  <li key={l.label} className="flex justify-between gap-4">
                    <span className="text-soft">{l.label}</span>
                    <span>
                      {money(l.amount)}
                      {l.recurring && "/mo"}
                    </span>
                  </li>
                ))}
                {r.estimate.speedFee > 0 && (
                  <li className="flex justify-between gap-4">
                    <span className="text-soft">Faster delivery ({r.selection.speed})</span>
                    <span>{money(r.estimate.speedFee)}</span>
                  </li>
                )}
                <li className="mt-1 flex justify-between gap-4 border-t border-line pt-2 font-semibold">
                  <span>Estimate</span>
                  <span>{money(r.estimate.total)}</span>
                </li>
              </ul>
            )}
            {r.notes && <p className="whitespace-pre-line rounded-xl bg-raised p-3 text-[14px] leading-relaxed">{r.notes}</p>}
            <p className="text-[14px] text-muted">
              {r.phone}
              {r.email && ` · ${r.email}`}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-[13px] text-muted">
              Status
              <select
                value={r.status}
                onChange={(e) => setRequestStatus(r.id, e.target.value as RequestStatus)}
                className={inputCls}
              >
                {REQUEST_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            {r.phone ? (
              <a
                href={clientWhatsApp(r.phone, `Hi ${r.name.split(" ")[0]}, this is ShipKaro about your ${r.itemTitle} request.`)}
                target="_blank"
                rel="noopener noreferrer"
                className={btnSm + " bg-accent text-ink hover:bg-accent-hover"}
              >
                <MessageCircle className="size-4" aria-hidden /> Reply on WhatsApp
              </a>
            ) : (
              r.email && (
                <a href={`mailto:${r.email}`} className={btnSm + " bg-accent text-ink hover:bg-accent-hover"}>
                  <Mail className="size-4" aria-hidden /> Reply by email
                </a>
              )
            )}
            {r.status !== "won" && !converting && (
              <button type="button" onClick={() => setConverting(true)} className={btnSm + " border border-line-strong hover:border-faint"}>
                Won it, start project
              </button>
            )}
            {converting && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = Number(price);
                  if (!n || !due) return;
                  convertToProject(r.id, n, due);
                  setConverting(false);
                }}
                className="flex flex-col gap-2 rounded-xl border border-line p-3"
              >
                <label className="flex flex-col gap-1 text-[13px] text-muted">
                  Agreed price (₹)
                  <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} className={inputCls} required />
                </label>
                <label className="flex flex-col gap-1 text-[13px] text-muted">
                  Due date
                  <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} required />
                </label>
                <button type="submit" className={btnSm + " bg-fg text-bg"}>
                  Create project
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={() => confirm("Delete this request?") && deleteRequest(r.id)}
              className={btnSm + " text-danger hover:bg-danger/10"}
            >
              <Trash2 className="size-4" aria-hidden /> Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/* ================================================================== */
/* Projects                                                            */
/* ================================================================== */

export function ProjectsView() {
  const db = useDB();
  const ready = useHydrated();
  const [adding, setAdding] = useState(false);
  const [stageFilter, setStageFilter] = useState<ProjectStage | "active" | "all">("active");
  if (!ready) return null;

  const list = db.projects
    .filter((p) => (stageFilter === "all" ? true : stageFilter === "active" ? p.stage !== "delivered" : p.stage === stageFilter))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <>
      <PageHeader title="Projects" sub="Track every build from kick-off to delivery, and what is still to collect.">
        <button type="button" onClick={() => setAdding((v) => !v)} className={btnSm + " bg-fg text-bg"}>
          <Plus className="size-4" aria-hidden /> Add project
        </button>
      </PageHeader>

      {adding && <NewProjectForm onDone={() => setAdding(false)} />}

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { id: "active" as const, label: "Active" },
          ...PROJECT_STAGES.map((s) => ({ id: s.id, label: s.label })),
          { id: "all" as const, label: "All" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={stageFilter === t.id}
            onClick={() => setStageFilter(t.id)}
            className={
              "min-h-10 rounded-full border px-3.5 text-[14px] transition-colors " +
              (stageFilter === t.id ? "border-fg bg-fg text-bg" : "border-line-strong text-soft hover:text-fg")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="No projects here" body="Projects appear when you mark a request as won, or add one by hand." />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((p) => (
            <ProjectRow key={p.id} p={p} paid={paidFor(db, p.id)} />
          ))}
        </ul>
      )}
    </>
  );
}

function ProjectRow({ p, paid }: { p: Project; paid: number }) {
  const [paying, setPaying] = useState(false);
  const due = dueLabel(p);
  const balance = Math.max(0, p.agreedPrice - paid);
  const pct = p.agreedPrice ? Math.min(100, Math.round((paid / p.agreedPrice) * 100)) : 0;

  return (
    <li className="rounded-[20px] border border-line bg-card p-4 sm:p-5">
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center">
        <div className="min-w-0">
          <p className="text-[16px] font-medium">{p.title}</p>
          <p className="mt-0.5 truncate text-[14px] text-muted">{p.client}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <select
            aria-label="Stage"
            value={p.stage}
            onChange={(e) => updateProject(p.id, { stage: e.target.value as ProjectStage })}
            className={inputCls}
          >
            {PROJECT_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="text-[12px] text-muted">
            <Badge tone={due.tone}>{due.text}</Badge> {fmtDate(p.dueDate)}
          </span>
        </div>
        <div className="text-[14px]">
          <p>
            <span className="font-semibold">{money(paid)}</span> <span className="text-muted">of {money(p.agreedPrice)}</span>
          </p>
          <p className={"mt-0.5 text-[13px] " + (balance ? "text-muted" : "text-success")}>
            {balance ? `${pct}% paid, ${money(balance)} to collect` : "Fully paid"}
          </p>
        </div>
        <div className="flex gap-2">
          {balance > 0 && (
            <button type="button" onClick={() => setPaying((v) => !v)} className={btnSm + " border border-line-strong hover:border-faint"}>
              Record payment
            </button>
          )}
          <button
            type="button"
            aria-label="Delete project"
            onClick={() => confirm("Delete this project and its payments?") && deleteProject(p.id)}
            className={btnSm + " px-2.5 text-faint hover:bg-danger/10 hover:text-danger"}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      {paying && <PaymentForm projectId={p.id} suggested={balance} onDone={() => setPaying(false)} />}
    </li>
  );
}

export function PaymentForm({
  projectId,
  suggested,
  onDone,
  projects,
}: {
  projectId?: string;
  suggested?: number;
  onDone: () => void;
  projects?: Project[];
}) {
  const [pid, setPid] = useState(projectId ?? projects?.[0]?.id ?? "");
  const [amount, setAmount] = useState(suggested ? String(suggested) : "");
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState<PayMethod>("UPI");
  const [kind, setKind] = useState<PayKind>("balance");
  const [note, setNote] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(amount);
        if (!n || !pid) return;
        addPayment({ projectId: pid, amount: n, date, method, kind, note: note.trim() });
        onDone();
      }}
      className="mt-4 grid grid-cols-1 gap-3 rounded-xl min-[400px]:grid-cols-2 border border-line bg-bg p-3 sm:grid-cols-3 lg:grid-cols-6 lg:items-end"
    >
      {projects && (
        <label className="col-span-full flex flex-col gap-1 text-[13px] text-muted sm:col-span-3 lg:col-span-2">
          Project
          <select value={pid} onChange={(e) => setPid(e.target.value)} className={inputCls} required>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}, {p.client}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        Amount (₹)
        <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} className={inputCls} required />
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} required />
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        Method
        <select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)} className={inputCls}>
          {PAY_METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        Type
        <select value={kind} onChange={(e) => setKind(e.target.value as PayKind)} className={inputCls}>
          {PAY_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </label>
      {!projects && (
        <label className="flex flex-col gap-1 text-[13px] text-muted">
          Note
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="UPI ref, optional" />
        </label>
      )}
      <button type="submit" className={btnSm + " col-span-full bg-fg text-bg sm:col-span-1"}>
        Save payment
      </button>
    </form>
  );
}

function NewProjectForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [phone, setPhone] = useState("");
  const [price, setPrice] = useState("");
  const [due, setDue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !client.trim() || !Number(price) || !due) return;
        addProject({
          title: title.trim(),
          client: client.trim(),
          phone: phone.trim(),
          agreedPrice: Number(price),
          startDate: today(),
          dueDate: due,
          stage: "kickoff",
        });
        onDone();
      }}
      className="mb-6 grid grid-cols-1 gap-3 rounded-[20px] border border-line bg-card p-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
    >
      <label className="flex flex-col gap-1 text-[13px] text-muted lg:col-span-2">
        Project
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Gym management" required />
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        Client
        <input value={client} onChange={(e) => setClient(e.target.value)} className={inputCls} required />
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        WhatsApp
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        Price (₹)
        <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} className={inputCls} required />
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-muted">
        Due date
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} required />
      </label>
      <button type="submit" className={btnSm + " bg-fg text-bg sm:col-span-2 lg:col-span-6 lg:justify-self-end"}>
        Save project
      </button>
    </form>
  );
}
