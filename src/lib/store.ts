"use client";

/**
 * ShipKaro admin data layer (browser side)
 * ---------------------------------------------------------------
 * The browser never talks to Firebase. Admin screens load and change data
 * through /api/admin, which checks the signed admin cookie set by
 * /api/admin/session (password login). Data reloads after every change,
 * when the tab regains focus, and every 30 seconds while open.
 */

import { useSyncExternalStore } from "react";
import type { DB, Expense, Payment, Project, RequestStatus } from "@/lib/model";

export * from "@/lib/model";

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

const EMPTY: DB = { requests: [], projects: [], payments: [], expenses: [] };

export type AuthState = { status: "loading" | "signedOut" | "admin" };

const LOADING: AuthState = { status: "loading" };
let state: DB = EMPTY;
let authState: AuthState = LOADING;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  start();
  return () => {
    listeners.delete(l);
  };
}

let started = false;
let timer: ReturnType<typeof setInterval> | undefined;

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void refresh();
  window.addEventListener("focus", () => void refresh());
}

function setSignedIn(signedIn: boolean) {
  const next = signedIn ? "admin" : "signedOut";
  if (authState.status !== next) authState = { status: next };
  if (signedIn && !timer) timer = setInterval(() => void refresh(), 30_000);
  if (!signedIn) {
    clearInterval(timer);
    timer = undefined;
    state = EMPTY;
  }
}

/** Reloads all admin data. Marks the session signed out if the cookie is missing or expired. */
export async function refresh() {
  try {
    const res = await fetch("/api/admin", { cache: "no-store" });
    if (res.status === 401) {
      setSignedIn(false);
    } else if (res.ok) {
      state = (await res.json()) as DB;
      setSignedIn(true);
    } else {
      console.error("Loading admin data failed", res.status);
      if (authState.status === "loading") setSignedIn(false);
    }
  } catch (err) {
    console.error("Loading admin data failed", err);
    if (authState.status === "loading") setSignedIn(false);
  }
  emit();
}

/** All admin data. Empty until the admin is signed in. */
export function useDB(): DB {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

export function useAuthState(): AuthState {
  return useSyncExternalStore(subscribe, () => authState, () => LOADING);
}

/** True once running in the browser (avoids flashing empty states during hydration). */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/* ------------------------------------------------------------------ */
/* Admin sign-in (password)                                            */
/* ------------------------------------------------------------------ */

/** Returns true on success. */
export async function signInAdmin(password: string) {
  const res = await fetch("/api/admin/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return false;
  await refresh();
  return true;
}

export async function signOutAdmin() {
  await fetch("/api/admin/session", { method: "DELETE" }).catch(() => {});
  setSignedIn(false);
  emit();
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

/** Sends one change to the server, then reloads. Tells the admin if it failed. */
async function adminWrite(payload: Record<string, unknown>) {
  try {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      alert("Your admin session has ended. Please sign in again.");
    } else if (!res.ok) {
      const { error } = (await res.json().catch(() => ({}))) as { error?: string };
      alert(error ? `Could not save: ${error}` : "Could not save that change. Please try again.");
    }
  } catch (err) {
    console.error(err);
    alert("Could not save that change. Check your connection.");
  }
  await refresh();
}

export const today = () => new Date().toISOString().slice(0, 10);

export function setRequestStatus(id: string, status: RequestStatus) {
  // Show the new status straight away; the reload confirms it.
  state = { ...state, requests: state.requests.map((r) => (r.id === id ? { ...r, status } : r)) };
  emit();
  return adminWrite({ op: "setRequestStatus", id, status });
}

export function deleteRequest(id: string) {
  return adminWrite({ op: "deleteRequest", id });
}

/** Marks the request as won and opens a project for it */
export function convertToProject(id: string, agreedPrice: number, dueDate: string) {
  return adminWrite({ op: "convertToProject", id, agreedPrice, dueDate });
}

export function addProject(p: Omit<Project, "id">) {
  return adminWrite({ op: "addProject", data: p });
}

export function updateProject(id: string, patch: Partial<Omit<Project, "id">>) {
  state = { ...state, projects: state.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
  emit();
  return adminWrite({ op: "updateProject", id, data: patch });
}

export function deleteProject(id: string) {
  return adminWrite({ op: "deleteProject", id });
}

export function addPayment(p: Omit<Payment, "id">) {
  return adminWrite({ op: "addPayment", data: p });
}

export function deletePayment(id: string) {
  return adminWrite({ op: "deletePayment", id });
}

export function addExpense(e: Omit<Expense, "id">) {
  return adminWrite({ op: "addExpense", data: e });
}

export function deleteExpense(id: string) {
  return adminWrite({ op: "deleteExpense", id });
}

/* ------------------------------------------------------------------ */
/* Derived numbers                                                     */
/* ------------------------------------------------------------------ */

export function paidFor(db: DB, projectId: string) {
  return db.payments.filter((p) => p.projectId === projectId).reduce((s, p) => s + p.amount, 0);
}
