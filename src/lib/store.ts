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
  // Catch up when the admin comes back to the tab (not more than every 10s).
  let lastFocus = 0;
  window.addEventListener("focus", () => {
    if (Date.now() - lastFocus < 10_000) return;
    lastFocus = Date.now();
    void refresh();
  });
}

function setSignedIn(signedIn: boolean) {
  const next = signedIn ? "admin" : "signedOut";
  if (authState.status !== next) authState = { status: next };
  if (signedIn && !timer) timer = setInterval(() => !document.hidden && void refresh(), 30_000);
  if (!signedIn) {
    clearInterval(timer);
    timer = undefined;
    state = EMPTY;
  }
}

let inflight: Promise<void> | null = null;

/** Reloads all admin data. Marks the session signed out if the cookie is missing or expired. */
export function refresh() {
  // Calls made while a reload is running share it instead of stacking requests.
  inflight ??= load().finally(() => (inflight = null));
  return inflight;
}

async function load() {
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
/*
 * Every change is applied on screen first (optimistic), then sent to the
 * server. On failure the admin is told and the data reloads from the server.
 * Adds reload quietly afterwards to pick up the real document ids.
 */

function apply(next: Partial<DB>) {
  state = { ...state, ...next };
  emit();
}

const tempId = () => `tmp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

async function adminWrite(payload: Record<string, unknown>, { reload = false } = {}) {
  try {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      if (reload) void refresh();
      return;
    }
    if (res.status === 401) {
      alert("Your admin session has ended. Please sign in again.");
    } else {
      const { error } = (await res.json().catch(() => ({}))) as { error?: string };
      alert(error ? `Could not save: ${error}` : "Could not save that change. Please try again.");
    }
  } catch (err) {
    console.error(err);
    alert("Could not save that change. Check your connection.");
  }
  await refresh(); // undo the optimistic change
}

export const today = () => new Date().toISOString().slice(0, 10);

export function setRequestStatus(id: string, status: RequestStatus) {
  apply({ requests: state.requests.map((r) => (r.id === id ? { ...r, status } : r)) });
  return adminWrite({ op: "setRequestStatus", id, status });
}

export function deleteRequest(id: string) {
  apply({ requests: state.requests.filter((r) => r.id !== id) });
  return adminWrite({ op: "deleteRequest", id });
}

/** Marks the request as won and opens a project for it */
export function convertToProject(id: string, agreedPrice: number, dueDate: string) {
  const r = state.requests.find((x) => x.id === id);
  if (r) {
    apply({
      requests: state.requests.map((x) => (x.id === id ? { ...x, status: "won" as const } : x)),
      projects: [
        ...state.projects,
        {
          id: tempId(),
          requestId: id,
          client: r.org ? `${r.name}, ${r.org}` : r.name,
          phone: r.phone,
          title: r.itemTitle,
          agreedPrice,
          startDate: today(),
          dueDate,
          stage: "kickoff" as const,
        },
      ].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    });
  }
  return adminWrite({ op: "convertToProject", id, agreedPrice, dueDate }, { reload: true });
}

export function addProject(p: Omit<Project, "id">) {
  apply({ projects: [...state.projects, { ...p, id: tempId() }].sort((a, b) => a.dueDate.localeCompare(b.dueDate)) });
  return adminWrite({ op: "addProject", data: p }, { reload: true });
}

export function updateProject(id: string, patch: Partial<Omit<Project, "id">>) {
  apply({ projects: state.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  return adminWrite({ op: "updateProject", id, data: patch });
}

export function deleteProject(id: string) {
  apply({ projects: state.projects.filter((p) => p.id !== id), payments: state.payments.filter((p) => p.projectId !== id) });
  return adminWrite({ op: "deleteProject", id });
}

export function addPayment(p: Omit<Payment, "id">) {
  apply({ payments: [{ ...p, id: tempId() }, ...state.payments].sort((a, b) => b.date.localeCompare(a.date)) });
  return adminWrite({ op: "addPayment", data: p }, { reload: true });
}

export function deletePayment(id: string) {
  apply({ payments: state.payments.filter((p) => p.id !== id) });
  return adminWrite({ op: "deletePayment", id });
}

export function addExpense(e: Omit<Expense, "id">) {
  apply({ expenses: [{ ...e, id: tempId() }, ...state.expenses].sort((a, b) => b.date.localeCompare(a.date)) });
  return adminWrite({ op: "addExpense", data: e }, { reload: true });
}

export function deleteExpense(id: string) {
  apply({ expenses: state.expenses.filter((e) => e.id !== id) });
  return adminWrite({ op: "deleteExpense", id });
}

/* ------------------------------------------------------------------ */
/* Derived numbers                                                     */
/* ------------------------------------------------------------------ */

export function paidFor(db: DB, projectId: string) {
  return db.payments.filter((p) => p.projectId === projectId).reduce((s, p) => s + p.amount, 0);
}
