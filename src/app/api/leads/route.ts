import { after } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import type { ProjectRequest } from "@/lib/model";
import { adminDb, notifyTelegram } from "@/lib/server/admin";

/**
 * POST /api/leads
 * Called by the Sellbird outreach bridge (outreach/shipkaro_bridge.py) when a
 * cold-email prospect says yes to the offer. Saves them as a request so they
 * show up in /admin, and pings Telegram.
 * Auth: "Authorization: Bearer <OUTREACH_TOKEN>".
 */

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function authorized(req: Request) {
  const expected = process.env.OUTREACH_TOKEN;
  if (!expected) return false;
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET /api/leads?days=30
 * The whole business, read-only, for Lyra (the Jarvis assistant). Same bearer token.
 * Returns every request (deal), project, payment and expense, plus worked-out numbers:
 * revenue by month, profit, money still due per project, conversion and where deals come from.
 * `days` only sets the "recent" window; totals always cover all time.
 */
type Doc = Record<string, unknown> & { id: string };
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const s = (v: unknown) => (typeof v === "string" ? v : "");

export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ ok: false }, { status: 401 });
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days")) || 30));
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const since = new Date(now.getTime() - days * 86_400_000).toISOString();
  const thisMonth = today.slice(0, 7);
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);

  let requests: Doc[], projects: Doc[], payments: Doc[], expenses: Doc[];
  try {
    const db = adminDb();
    const all = (c: string) =>
      db.collection(c).get().then((snap) =>
        snap.docs.map((d) => {
          const data = { ...d.data() };
          delete data.serverCreatedAt;
          return { ...data, id: d.id } as Doc;
        }),
      );
    [requests, projects, payments, expenses] = await Promise.all([all("requests"), all("projects"), all("payments"), all("expenses")]);
  } catch (err) {
    console.error("Business summary failed", err);
    return Response.json({ ok: false }, { status: 500 });
  }

  const count = <T,>(items: T[], key: (x: T) => string) =>
    items.reduce<Record<string, number>>((m, x) => ((m[key(x) || "unknown"] = (m[key(x) || "unknown"] ?? 0) + 1), m), {});
  const sumBy = (items: Doc[], key: (x: Doc) => string) =>
    items.reduce<Record<string, number>>((m, x) => ((m[key(x)] = (m[key(x)] ?? 0) + n(x.amount)), m), {});
  const total = (items: Doc[]) => items.reduce((t, x) => t + n(x.amount), 0);

  // Money
  const receivedByMonth = sumBy(payments, (p) => s(p.date).slice(0, 7));
  const spentByMonth = sumBy(expenses, (e) => s(e.date).slice(0, 7));
  const months = [...new Set([...Object.keys(receivedByMonth), ...Object.keys(spentByMonth)])].filter(Boolean).sort().slice(-12);
  const byMonth = months.map((m) => ({
    month: m,
    received: receivedByMonth[m] ?? 0,
    spent: spentByMonth[m] ?? 0,
    profit: (receivedByMonth[m] ?? 0) - (spentByMonth[m] ?? 0),
  }));

  // Projects with what's been paid and what's still due
  const paidFor = sumBy(payments, (p) => s(p.projectId));
  const projectRows = projects
    .map((p) => {
      const paid = paidFor[p.id] ?? 0;
      const due = Math.max(0, n(p.agreedPrice) - paid);
      return {
        title: s(p.title), client: s(p.client), phone: s(p.phone) || undefined, stage: s(p.stage),
        agreedPrice: n(p.agreedPrice), paid, due, startDate: s(p.startDate), dueDate: s(p.dueDate),
        overdue: s(p.stage) !== "delivered" && !!s(p.dueDate) && s(p.dueDate) < today,
      };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const openProjects = projectRows.filter((p) => p.stage !== "delivered");

  // Deals (requests)
  const won = requests.filter((r) => r.status === "won").length;
  const closed = requests.filter((r) => r.status === "won" || r.status === "lost").length;
  const est = (r: Doc) => (r.estimate ?? {}) as Record<string, unknown>;
  const recent = requests
    .filter((r) => s(r.createdAt) >= since)
    .sort((a, b) => s(b.createdAt).localeCompare(s(a.createdAt)))
    .map((r) => ({
      name: s(r.name), org: s(r.org) || undefined, item: s(r.itemTitle), category: s(r.categoryTitle) || undefined,
      price: est(r).custom ? "Custom quote" : n(est(r).total), budget: s(r.budget) || undefined,
      status: s(r.status), source: s(r.source) || "website", email: s(r.email) || undefined, phone: s(r.phone) || undefined,
      deadline: s(r.deadline) || undefined, createdAt: s(r.createdAt), notes: s(r.notes).slice(0, 500),
    }));

  const body = {
    ok: true,
    generatedAt: now.toISOString(),
    currency: "INR",
    revenue: {
      allTime: total(payments),
      thisMonth: receivedByMonth[thisMonth] ?? 0,
      lastMonth: receivedByMonth[lastMonth] ?? 0,
      expensesAllTime: total(expenses),
      expensesThisMonth: spentByMonth[thisMonth] ?? 0,
      profitAllTime: total(payments) - total(expenses),
      stillToCollect: projectRows.reduce((t, p) => t + p.due, 0),
      byMonth,
      byPaymentKind: sumBy(payments, (p) => s(p.kind)),
      byMethod: sumBy(payments, (p) => s(p.method)),
      expensesByCategory: sumBy(expenses, (e) => s(e.category)),
    },
    deals: {
      total: requests.length,
      byStatus: count(requests, (r) => s(r.status)),
      bySource: count(requests, (r) => s(r.source) || "website"),
      byService: count(requests, (r) => s(r.itemTitle)),
      winRate: closed ? Math.round((won / closed) * 100) / 100 : null,
      newInWindow: recent.length,
      windowDays: days,
      recent,
    },
    projects: {
      total: projectRows.length,
      byStage: count(projectRows, (p) => p.stage),
      open: openProjects,
      overdue: openProjects.filter((p) => p.overdue),
      delivered: projectRows.filter((p) => p.stage === "delivered").length,
    },
    recentPayments: [...payments].sort((a, b) => s(b.date).localeCompare(s(a.date))).slice(0, 15)
      .map((p) => ({ date: s(p.date), amount: n(p.amount), method: s(p.method), kind: s(p.kind), note: s(p.note) || undefined,
        project: s(projects.find((x) => x.id === p.projectId)?.title) || undefined })),
    recentExpenses: [...expenses].sort((a, b) => s(b.date).localeCompare(s(a.date))).slice(0, 15)
      .map((e) => ({ date: s(e.date), amount: n(e.amount), category: s(e.category), note: s(e.note) || undefined })),
  };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!authorized(req)) return Response.json({ ok: false }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const email = str(body.email, 120);
  const company = str(body.company, 120);
  const name = str(body.name, 80) || company || email;
  if (!email && !company) return Response.json({ ok: false, error: "Need an email or company." }, { status: 400 });

  const website = str(body.website, 200);
  const title = str(body.title, 80);
  const offer = str(body.offer, 300);
  const reply = str(body.reply, 3000);
  const notes = [
    "Cold email lead (Sellbird): said yes to the offer.",
    offer && `Offer: ${offer}`,
    title && `Role: ${title}`,
    website && `Website: ${website}`,
    reply && `\nTheir reply:\n${reply}`,
  ]
    .filter(Boolean)
    .join("\n");

  const record: Omit<ProjectRequest, "id"> = {
    createdAt: new Date().toISOString(),
    name,
    phone: "",
    email,
    org: company,
    categoryTitle: "Outreach",
    itemTitle: "Cold email lead",
    selection: { itemSlug: "other", addonIds: [], speed: "standard" },
    estimate: { lines: [], oneTime: 0, speedFee: 0, total: 0, monthly: 0, advance: 0, balance: 0, custom: true },
    deadline: "",
    budget: "",
    notes,
    status: "new",
  };

  try {
    await adminDb()
      .collection("requests")
      .add({ ...record, source: "sellbird", serverCreatedAt: FieldValue.serverTimestamp() });
  } catch (err) {
    console.error("Saving lead failed", err);
    return Response.json({ ok: false }, { status: 500 });
  }

  after(() =>
    notifyTelegram(
      ["New cold email lead", "", `${name}${company && company !== name ? `, ${company}` : ""}`, email && `Email: ${email}`, website, offer && `Offer: ${offer}`, reply && `\n${reply}`]
        .filter(Boolean)
        .join("\n"),
    ),
  );

  return Response.json({ ok: true });
}
