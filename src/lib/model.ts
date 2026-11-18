/**
 * Shared ShipKaro data types and the price estimate. Used by the browser
 * (builder, admin screens) and by the server (API routes recheck prices).
 */

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

