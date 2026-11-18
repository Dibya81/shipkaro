import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot, WriteBatch } from "firebase-admin/firestore";
import {
  EXPENSE_CATEGORIES,
  PAY_KINDS,
  PAY_METHODS,
  PROJECT_STAGES,
  REQUEST_STATUSES,
  type DB,
  type Expense,
  type Payment,
  type Project,
} from "@/lib/model";
import { adminDb, isAdminRequest } from "@/lib/server/admin";

/**
 * Admin data API. Every call needs the signed admin cookie from /api/admin/session.
 *   GET   returns all requests, projects, payments and expenses
 *   POST  { op, ... } performs one change (see the switch below)
 */

type Coll = keyof DB;
const COLLS: Coll[] = ["requests", "projects", "payments", "expenses"];

type Row = { id: string } & Record<string, unknown>;
const SORTS: Record<Coll, (a: Row, b: Row) => number> = {
  requests: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
  projects: (a, b) => String(a.dueDate).localeCompare(String(b.dueDate)),
  payments: (a, b) => String(b.date).localeCompare(String(a.date)),
  expenses: (a, b) => String(b.date).localeCompare(String(a.date)),
};

function toRow(d: QueryDocumentSnapshot<DocumentData>): Row {
  // Drop Firestore-only fields (Timestamps) so the response is plain JSON.
  const rest = { ...d.data() };
  delete rest.serverCreatedAt;
  return { ...rest, id: d.id };
}

const unauthorized = () => Response.json({ ok: false, error: "Not signed in" }, { status: 401 });
const bad = (error: string) => Response.json({ ok: false, error }, { status: 400 });

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();
  const db = adminDb();
  const snaps = await Promise.all(COLLS.map((c) => db.collection(c).get()));
  const out = {} as Record<Coll, Row[]>;
  COLLS.forEach((c, i) => {
    out[c] = snaps[i].docs.map(toRow).sort(SORTS[c]);
  });
  return Response.json(out, { headers: { "Cache-Control": "no-store" } });
}

/* ------------------------------------------------------------------ */
/* Input cleaning                                                      */
/* ------------------------------------------------------------------ */

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1e9 ? Math.round(v) : 0);
const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
const id = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(v) ? v : "");
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

const STATUS_IDS = REQUEST_STATUSES.map((s) => s.id);
const STAGE_IDS = PROJECT_STAGES.map((s) => s.id);
const KIND_IDS = PAY_KINDS.map((k) => k.id);

function projectFields(p: Record<string, unknown>, partial: boolean): Partial<Omit<Project, "id">> {
  const out: Partial<Omit<Project, "id">> = {};
  const has = (k: string) => !partial || k in p;
  if (has("client")) out.client = str(p.client, 120);
  if (has("phone")) out.phone = str(p.phone, 24);
  if (has("title")) out.title = str(p.title, 120);
  if (has("agreedPrice")) out.agreedPrice = num(p.agreedPrice);
  if (has("startDate")) out.startDate = date(p.startDate);
  if (has("dueDate")) out.dueDate = date(p.dueDate);
  if (has("stage")) out.stage = oneOf(p.stage, STAGE_IDS, "kickoff");
  if (id(p.requestId)) out.requestId = id(p.requestId);
  return out;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Free "undo" for deletes (the free Firebase plan has no backups): every deleted
 * record is copied into the trash collection in the same atomic batch, so it can
 * be restored from the Firebase console if it was deleted by mistake.
 */
function trashAndDelete(batch: WriteBatch, snap: DocumentSnapshot) {
  if (!snap.exists) return;
  const db = adminDb();
  batch.set(db.collection("trash").doc(), {
    collection: snap.ref.parent.id,
    docId: snap.id,
    data: snap.data(),
    deletedAt: new Date().toISOString(),
  });
  batch.delete(snap.ref);
}

async function deleteWithTrash(coll: Coll, docId: string) {
  const db = adminDb();
  const batch = db.batch();
  trashAndDelete(batch, await db.collection(coll).doc(docId).get());
  await batch.commit();
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return bad("Invalid JSON");
  }

  const db = adminDb();
  const data = (body.data ?? {}) as Record<string, unknown>;
  const docId = id(body.id);

  try {
    switch (body.op) {
      case "setRequestStatus": {
        if (!docId) return bad("Missing id");
        await db.collection("requests").doc(docId).update({ status: oneOf(body.status, STATUS_IDS, "new") });
        break;
      }
      case "deleteRequest": {
        if (!docId) return bad("Missing id");
        await deleteWithTrash("requests", docId);
        break;
      }
      case "convertToProject": {
        if (!docId) return bad("Missing id");
        const snap = await db.collection("requests").doc(docId).get();
        if (!snap.exists) return bad("Request not found");
        const r = snap.data()!;
        const project: Omit<Project, "id"> = {
          requestId: docId,
          client: r.org ? `${r.name}, ${r.org}` : String(r.name ?? ""),
          phone: String(r.phone ?? ""),
          title: String(r.itemTitle ?? ""),
          agreedPrice: num(body.agreedPrice),
          startDate: today(),
          dueDate: date(body.dueDate),
          stage: "kickoff",
        };
        const batch = db.batch();
        batch.update(snap.ref, { status: "won" });
        batch.set(db.collection("projects").doc(), project);
        await batch.commit();
        break;
      }
      case "addProject": {
        const p = projectFields(data, false);
        if (!p.client || !p.title) return bad("Client and title are required");
        await db.collection("projects").add(p);
        break;
      }
      case "updateProject": {
        if (!docId) return bad("Missing id");
        const patch = projectFields(data, true);
        if (Object.keys(patch).length) await db.collection("projects").doc(docId).update(patch);
        break;
      }
      case "deleteProject": {
        if (!docId) return bad("Missing id");
        const [project, pays] = await Promise.all([
          db.collection("projects").doc(docId).get(),
          db.collection("payments").where("projectId", "==", docId).get(),
        ]);
        const batch = db.batch();
        trashAndDelete(batch, project);
        pays.docs.forEach((d) => trashAndDelete(batch, d));
        await batch.commit();
        break;
      }
      case "addPayment": {
        const p: Omit<Payment, "id"> = {
          projectId: id(data.projectId),
          date: date(data.date) || today(),
          amount: num(data.amount),
          method: oneOf(data.method, PAY_METHODS, "UPI"),
          kind: oneOf(data.kind, KIND_IDS, "other"),
          note: str(data.note, 500),
        };
        if (!p.projectId || !p.amount) return bad("Project and amount are required");
        await db.collection("payments").add(p);
        break;
      }
      case "deletePayment": {
        if (!docId) return bad("Missing id");
        await deleteWithTrash("payments", docId);
        break;
      }
      case "addExpense": {
        const e: Omit<Expense, "id"> = {
          date: date(data.date) || today(),
          category: oneOf(data.category, EXPENSE_CATEGORIES, "Other"),
          amount: num(data.amount),
          note: str(data.note, 500),
          ...(id(data.projectId) ? { projectId: id(data.projectId) } : {}),
        };
        if (!e.amount) return bad("Amount is required");
        await db.collection("expenses").add(e);
        break;
      }
      case "deleteExpense": {
        if (!docId) return bad("Missing id");
        await deleteWithTrash("expenses", docId);
        break;
      }
      default:
        return bad("Unknown operation");
    }
  } catch (err) {
    console.error("Admin write failed", body.op, err);
    return Response.json({ ok: false, error: "Could not save" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
