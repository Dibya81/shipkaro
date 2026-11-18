import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-only Firebase access and the admin session.
 * Credentials come from environment variables (.env.local locally, Vercel in production):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *   ADMIN_PASSWORD   password for /admin
 *   SESSION_SECRET   random string used to sign the admin cookie
 */

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

let db: Firestore | null = null;

export function adminDb(): Firestore {
  if (db) return db;
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: env("FIREBASE_PROJECT_ID"),
        clientEmail: env("FIREBASE_CLIENT_EMAIL"),
        // Vercel and .env files store the key with literal \n
        privateKey: env("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
      }),
    });
  db = getFirestore(app);
  return db;
}

/* ------------------------------------------------------------------ */
/* Admin session: a signed, http-only cookie                           */
/* ------------------------------------------------------------------ */

export const SESSION_COOKIE = "sk_admin";
export const SESSION_DAYS = 30;

function sign(value: string) {
  return createHmac("sha256", env("SESSION_SECRET")).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string) {
  // Compare digests so the length of the real password never leaks through timing.
  return safeEqual(sign(`pw:${input}`), sign(`pw:${env("ADMIN_PASSWORD")}`));
}

export function newSessionValue() {
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  return `${expires}.${sign(`session:${expires}`)}`;
}

function validSession(value: string | undefined) {
  if (!value) return false;
  const [expires, mac] = value.split(".");
  if (!expires || !mac || Number(expires) < Date.now()) return false;
  return safeEqual(mac, sign(`session:${expires}`));
}

/** True when the request carries a valid admin session cookie. */
export function isAdminRequest(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  return validSession(match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : undefined);
}

export function sessionCookieHeader(value: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`;
}

/* ------------------------------------------------------------------ */
/* Telegram                                                            */
/* ------------------------------------------------------------------ */

/** Sends a plain-text message to the owner. Silently skipped if not configured. */
export async function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4000), disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error("Telegram notify failed", err);
  }
}
