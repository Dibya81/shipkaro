import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { categoryOf, findItem, formatINR, speeds, type SpeedId } from "@/config/pricing";
import { startPage } from "@/config/site";
import { computeEstimate, type ProjectRequest, type Selection } from "@/lib/model";
import { adminDb, notifyTelegram } from "@/lib/server/admin";

/**
 * POST /api/requests
 * Saves a project request from the /start builder to Firestore and pings Telegram.
 * The price is recomputed here from the selection, so a visitor cannot send a fake total.
 */

const recent = new Map<string, number[]>(); // ip -> timestamps (best-effort, per instance)
const LIMIT = 5; // requests per 10 minutes per IP

function tooMany(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > LIMIT;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (tooMany(ip)) return Response.json({ ok: false, error: "Too many requests. Please message us on WhatsApp." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const d = (body.details ?? {}) as Record<string, unknown>;
  const s = (body.selection ?? {}) as Record<string, unknown>;

  const name = str(d.name, 80);
  const phone = str(d.phone, 24);
  const digits = phone.replace(/\D/g, "");
  const itemSlug = str(s.itemSlug, 60);
  const isOther = itemSlug === "other";
  const item = findItem(itemSlug);
  const speed = (speeds.some((x) => x.id === s.speed) ? s.speed : "standard") as SpeedId;
  const notes = str(d.notes, 4000);

  if (name.length < 2 || digits.length < 10 || digits.length > 15 || (!item && !isOther)) {
    return Response.json({ ok: false, error: "Missing or invalid details." }, { status: 400 });
  }
  if ((isOther || item?.quoteOnly) && notes.length < 10) {
    return Response.json({ ok: false, error: "Please describe your idea." }, { status: 400 });
  }

  const selection: Selection = {
    itemSlug,
    addonIds: Array.isArray(s.addonIds) ? s.addonIds.filter((x): x is string => typeof x === "string").slice(0, 30) : [],
    speed,
    ...(typeof s.variantId === "string" ? { variantId: s.variantId.slice(0, 40) } : {}),
  };
  const estimate = computeEstimate(selection);
  const otherTitle = startPage.builder.otherTitle;

  const record: Omit<ProjectRequest, "id"> = {
    createdAt: new Date().toISOString(),
    name,
    phone,
    email: str(d.email, 120),
    org: str(d.org, 120),
    categoryTitle: isOther ? otherTitle : (categoryOf(itemSlug)?.title ?? ""),
    itemTitle: isOther ? otherTitle : item!.title,
    selection,
    estimate,
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(str(d.deadline, 10)) ? str(d.deadline, 10) : "",
    budget: str(d.budget, 60),
    notes,
    status: "new",
  };

  try {
    await adminDb()
      .collection("requests")
      .add({ ...JSON.parse(JSON.stringify(record)), serverCreatedAt: FieldValue.serverTimestamp() });
  } catch (err) {
    console.error("Saving request failed", err);
    return Response.json({ ok: false }, { status: 500 });
  }

  const price = estimate.custom
    ? `Custom quote${record.budget ? ` (budget ${record.budget})` : ""}`
    : `${formatINR(estimate.total)}${estimate.monthly ? ` + ${formatINR(estimate.monthly)}/month` : ""}`;
  // Reply to the visitor straight away; the Telegram ping runs after the response.
  const alert =
    [
      "New ShipKaro request",
      "",
      `${record.itemTitle}: ${price}`,
      ...estimate.lines.slice(1).map((l) => `+ ${l.label}`),
      `Speed: ${speeds.find((x) => x.id === speed)?.label}`,
      record.deadline ? `Deadline: ${record.deadline}` : "",
      "",
      `${name}${record.org ? `, ${record.org}` : ""}`,
      `WhatsApp: ${phone}`,
      record.email ? `Email: ${record.email}` : "",
      notes ? `\n${notes}` : "",
    ]
      .filter((l) => l !== "")
      .join("\n");
  after(() => notifyTelegram(alert));

  return Response.json({ ok: true });
}
