"use client";

/**
 * ShipKaro data layer (front-end only for now)
 * ---------------------------------------------------------------
 * Requests from the /start builder, projects, payments and expenses.
 * Today everything is kept in this browser's localStorage so the admin area
 * works end to end. When Firebase is added, only the functions in the
 * "Persistence" block change; every screen keeps using useDB() and the actions.
 */

import { useSyncExternalStore } from "react";
import { addonsFor, findItem, speeds, type SpeedId } from "@/config/pricing";
import { policies } from "@/config/site";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type RequestStatus = "new" | "contacted" | "quoted" | "won" | "lost";
export type ProjectStage = "kickoff" | "building" | "review" | "delivered";
export type PayMethod = "UPI" | "Bank transfer" | "Cash" | "Card" | "PayPal";
export type PayKind = "advance" | "balance" | "maintenance" | "other";
export type ExpenseCategory =
  | "Hosting & domains"
  | "Software & tools"
  | "Freelancers"
  | "Marketing"
  | "Hardware"
  | "Other";

export const REQUEST_STATUSES: { id: RequestStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "quoted", label: "Quoted" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];
export const PROJECT_STAGES: { id: ProjectStage; label: string }[] = [
  { id: "kickoff", label: "Kick-off" },
  { id: "building", label: "Building" },
  { id: "review", label: "Client review" },
  { id: "delivered", label: "Delivered" },
];
export const PAY_METHODS: PayMethod[] = ["UPI", "Bank transfer", "Cash", "Card", "PayPal"];
export const PAY_KINDS: { id: PayKind; label: string }[] = [
  { id: "advance", label: "Advance" },
  { id: "balance", label: "Balance" },
  { id: "maintenance", label: "Maintenance" },
  { id: "other", label: "Other" },
];
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Hosting & domains",
  "Software & tools",
  "Freelancers",
  "Marketing",
  "Hardware",
  "Other",
];

export type Selection = {
  /** catalog slug, or "other" for a custom idea */
  itemSlug: string;
  variantId?: string;
  addonIds: string[];
  speed: SpeedId;
};

export type EstimateLine = { label: string; amount: number; recurring?: "month" };
export type Estimate = {
  lines: EstimateLine[];
  oneTime: number;
  speedFee: number;
  total: number;
  monthly: number;
  advance: number;
  balance: number;
  /** true when there is no fixed price and we quote after a chat */
  custom: boolean;
};

export type ProjectRequest = {
  id: string;
  createdAt: string; // ISO date-time
  name: string;
  phone: string;
  email: string;
  org: string;
  categoryTitle: string;
  itemTitle: string;
  selection: Selection;
  estimate: Estimate;
  deadline: string; // YYYY-MM-DD or ""
  budget: string;
  notes: string;
  status: RequestStatus;
};

export type Project = {
  id: string;
  requestId?: string;
  client: string;
  phone: string;
  title: string;
  agreedPrice: number;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  stage: ProjectStage;
};

export type Payment = {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  method: PayMethod;
  kind: PayKind;
  note: string;
};

export type Expense = {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  note: string;
  projectId?: string;
};

export type DB = {
  requests: ProjectRequest[];
  projects: Project[];
  payments: Payment[];
  expenses: Expense[];
  /** true while the demo data is loaded */
  sample: boolean;
};

/* ------------------------------------------------------------------ */
/* Estimate                                                            */
/* ------------------------------------------------------------------ */

export function computeEstimate(sel: Selection): Estimate {
  const item = findItem(sel.itemSlug);
  const empty: Estimate = { lines: [], oneTime: 0, speedFee: 0, total: 0, monthly: 0, advance: 0, balance: 0, custom: true };
  if (!item || item.quoteOnly) return empty;

  const lines: EstimateLine[] = [];
  const variant = item.variants?.find((v) => v.id === sel.variantId) ?? item.variants?.[0];
  lines.push({ label: variant ? `${item.title}: ${variant.label}` : item.title, amount: variant?.price ?? item.price ?? 0 });

  for (const a of addonsFor(item)) {
    if (sel.addonIds.includes(a.id)) lines.push({ label: a.label, amount: a.price, recurring: a.recurring });
  }

  const oneTime = lines.filter((l) => !l.recurring).reduce((s, l) => s + l.amount, 0);
  const monthly = lines.filter((l) => l.recurring).reduce((s, l) => s + l.amount, 0);
  const mult = speeds.find((s) => s.id === sel.speed)?.multiplier ?? 1;
  const speedFee = Math.round(oneTime * (mult - 1));
  const total = oneTime + speedFee;
  const advance = Math.round((total * policies.advancePercent) / 100);
  return { lines, oneTime, speedFee, total, monthly, advance, balance: total - advance, custom: false };
}

/* ------------------------------------------------------------------ */
/* Persistence (swap this block for Firebase later)                    */
/* ------------------------------------------------------------------ */

const KEY = "shipkaro-db-v1";
const EMPTY: DB = { requests: [], projects: [], payments: [], expenses: [], sample: false };

let state: DB = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as DB) };
  } catch {
    /* unreadable data: start empty */
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    try {
      state = e.newValue ? { ...EMPTY, ...(JSON.parse(e.newValue) as DB) } : EMPTY;
    } catch {
      return;
    }
    emit();
  });
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked: the change still applies for this visit */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: DB) {
  state = next;
  persist();
  emit();
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}

/** All data, live. Renders empty on the server and fills in after hydration. */
export function useDB(): DB {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => EMPTY,
  );
}

/** True once the browser data has been read (avoids flashing empty states). */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const today = () => new Date().toISOString().slice(0, 10);

export function addRequest(r: Omit<ProjectRequest, "id" | "createdAt" | "status">) {
  load();
  const req: ProjectRequest = { ...r, id: uid(), createdAt: new Date().toISOString(), status: "new" };
  commit({ ...state, requests: [req, ...state.requests] });
  return req;
}

export function setRequestStatus(id: string, status: RequestStatus) {
  commit({ ...state, requests: state.requests.map((r) => (r.id === id ? { ...r, status } : r)) });
}

export function deleteRequest(id: string) {
  commit({ ...state, requests: state.requests.filter((r) => r.id !== id) });
}

/** Marks the request as won and opens a project for it */
export function convertToProject(id: string, agreedPrice: number, dueDate: string) {
  const r = state.requests.find((x) => x.id === id);
  if (!r) return;
  const project: Project = {
    id: uid(),
    requestId: r.id,
    client: r.org ? `${r.name}, ${r.org}` : r.name,
    phone: r.phone,
    title: r.itemTitle,
    agreedPrice,
    startDate: today(),
    dueDate,
    stage: "kickoff",
  };
  commit({
    ...state,
    requests: state.requests.map((x) => (x.id === id ? { ...x, status: "won" } : x)),
    projects: [project, ...state.projects],
  });
}

export function addProject(p: Omit<Project, "id">) {
  commit({ ...state, projects: [{ ...p, id: uid() }, ...state.projects] });
}

export function updateProject(id: string, patch: Partial<Project>) {
  commit({ ...state, projects: state.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
}

export function deleteProject(id: string) {
  commit({
    ...state,
    projects: state.projects.filter((p) => p.id !== id),
    payments: state.payments.filter((p) => p.projectId !== id),
  });
}

export function addPayment(p: Omit<Payment, "id">) {
  commit({ ...state, payments: [{ ...p, id: uid() }, ...state.payments] });
}

export function deletePayment(id: string) {
  commit({ ...state, payments: state.payments.filter((p) => p.id !== id) });
}

export function addExpense(e: Omit<Expense, "id">) {
  commit({ ...state, expenses: [{ ...e, id: uid() }, ...state.expenses] });
}

export function deleteExpense(id: string) {
  commit({ ...state, expenses: state.expenses.filter((e) => e.id !== id) });
}

/** Wipes everything, including sample data. */
export function clearAll() {
  commit({ ...EMPTY });
}

export function loadSample() {
  commit(buildSample());
}

/**
 * First visit to /admin on this browser: load the sample data so every screen
 * has something to show. Never runs for visitors on the public site.
 */
export function seedSampleOnFirstVisit() {
  load();
  try {
    if (localStorage.getItem(KEY) === null) commit(buildSample());
  } catch {
    /* storage blocked */
  }
}

/* ------------------------------------------------------------------ */
/* Derived numbers                                                     */
/* ------------------------------------------------------------------ */

export function paidFor(db: DB, projectId: string) {
  return db.payments.filter((p) => p.projectId === projectId).reduce((s, p) => s + p.amount, 0);
}

/* ------------------------------------------------------------------ */
/* Sample data, so the dashboard is explorable before real requests    */
/* arrive. Dates are relative to today. Clear it from the admin bar.   */
/* ------------------------------------------------------------------ */

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function sampleRequest(
  daysBack: number,
  name: string,
  org: string,
  slug: string,
  addonIds: string[],
  status: RequestStatus,
  notes: string,
  variantId?: string,
): ProjectRequest {
  const item = findItem(slug)!;
  const selection: Selection = { itemSlug: slug, variantId, addonIds, speed: "standard" };
  const created = new Date();
  created.setDate(created.getDate() - daysBack);
  return {
    id: `s-req-${slug}-${daysBack}`,
    createdAt: created.toISOString(),
    name,
    phone: "+91 98XXX XXXXX",
    email: "",
    org,
    categoryTitle: "",
    itemTitle: item.title,
    selection,
    estimate: computeEstimate(selection),
    deadline: daysAgo(-21),
    budget: "",
    notes,
    status,
  };
}

function buildSample(): DB {
  const requests = [
    sampleRequest(0, "Rohit D.", "Iron Yard Fitness", "gym-fitness-management", ["whatsapp-alerts", "online-payments"], "new", "Two branches, around 400 members. Want renewal reminders on WhatsApp."),
    sampleRequest(1, "Ananya I.", "SRM Institute", "major-minor-projects", ["report", "viva"], "new", "Final-year project on crop disease detection with a simple web app.", "major"),
    sampleRequest(2, "Farhan Q.", "Chai Sutra Cafe", "restaurant-cafe-pos", ["qr-menu"], "contacted", "Single outlet, 12 tables. Need KOT printing."),
    sampleRequest(4, "Meera K.", "Kulkarni Dental Care", "clinic-hospital-software", ["whatsapp-alerts"], "quoted", "Appointment reminders matter most."),
    sampleRequest(6, "Arjun S.", "", "portfolio-websites", ["domain"], "won", "Developer portfolio with projects and blog later."),
    sampleRequest(9, "Gurpreet S.", "Sandhu PG Homes", "pg-hostel-management", ["online-payments", "data-import"], "won", "Three buildings, rent by UPI link."),
    sampleRequest(14, "Karthik R.", "ShelfSense", "saas-products", ["landing", "online-payments"], "lost", "Went with an in-house hire."),
  ];
  const projects: Project[] = [
    { id: "s-p1", client: "Gurpreet S., Sandhu PG Homes", phone: "", title: "PG & hostel management", agreedPrice: 26000, startDate: daysAgo(150), dueDate: daysAgo(120), stage: "delivered" },
    { id: "s-p2", client: "Nikhil V., Spice Route Foods", phone: "", title: "Inventory & GST billing", agreedPrice: 22000, startDate: daysAgo(110), dueDate: daysAgo(80), stage: "delivered" },
    { id: "s-p3", client: "Priya M., Bloom Salon", phone: "", title: "Booking & appointments", agreedPrice: 18000, startDate: daysAgo(70), dueDate: daysAgo(40), stage: "delivered" },
    { id: "s-p4", client: "Arjun S.", phone: "", title: "Portfolio website", agreedPrice: 2500, startDate: daysAgo(6), dueDate: daysAgo(-2), stage: "review" },
    { id: "s-p5", client: "Rahul T., Peak Coaching", phone: "", title: "School & coaching ERP", agreedPrice: 34000, startDate: daysAgo(25), dueDate: daysAgo(-14), stage: "building" },
    { id: "s-p6", client: "Sneha P., VIT", phone: "", title: "College project: Major", agreedPrice: 9000, startDate: daysAgo(12), dueDate: daysAgo(3), stage: "building" },
  ];
  const pay = (id: string, projectId: string, back: number, amount: number, kind: PayKind, method: PayMethod = "UPI"): Payment => ({
    id,
    projectId,
    date: daysAgo(back),
    amount,
    method,
    kind,
    note: "",
  });
  const payments: Payment[] = [
    pay("s-pay1", "s-p1", 150, 13000, "advance"),
    pay("s-pay2", "s-p1", 118, 13000, "balance", "Bank transfer"),
    pay("s-pay3", "s-p2", 110, 11000, "advance"),
    pay("s-pay4", "s-p2", 78, 11000, "balance"),
    pay("s-pay5", "s-p3", 70, 9000, "advance"),
    pay("s-pay6", "s-p3", 35, 9000, "balance"),
    pay("s-pay7", "s-p1", 60, 1999, "maintenance"),
    pay("s-pay8", "s-p1", 30, 1999, "maintenance"),
    pay("s-pay9", "s-p4", 6, 1250, "advance"),
    pay("s-pay10", "s-p5", 25, 17000, "advance", "Bank transfer"),
    pay("s-pay11", "s-p6", 12, 4500, "advance"),
  ];
  const exp = (id: string, back: number, category: ExpenseCategory, amount: number, note: string): Expense => ({
    id,
    date: daysAgo(back),
    category,
    amount,
    note,
  });
  const expenses: Expense[] = [
    exp("s-e1", 160, "Software & tools", 1650, "Figma and GitHub"),
    exp("s-e2", 140, "Hosting & domains", 2400, "Servers for PG app"),
    exp("s-e3", 100, "Freelancers", 6000, "Android build help"),
    exp("s-e4", 95, "Marketing", 3000, "Instagram ads"),
    exp("s-e5", 70, "Software & tools", 1650, "Figma and GitHub"),
    exp("s-e6", 45, "Hardware", 4200, "Biometric test device"),
    exp("s-e7", 30, "Marketing", 2500, "Instagram ads"),
    exp("s-e8", 20, "Hosting & domains", 1200, "Domains"),
    exp("s-e9", 8, "Software & tools", 1650, "Figma and GitHub"),
  ];
  return { requests, projects, payments, expenses, sample: true };
}
