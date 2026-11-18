"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, FolderKanban, Inbox, LayoutDashboard, LogOut, ShieldAlert, Wallet } from "lucide-react";
import { brand } from "@/config/site";
import { signInAdmin, signOutAdmin, useAuthState, useDB, useHydrated } from "@/lib/store";
import { btnSm } from "@/components/admin/ui";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/requests", label: "Requests", icon: Inbox },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/finance", label: "Finance", icon: Wallet },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();
  const hydrated = useHydrated();
  if (!hydrated || auth.status === "loading") {
    return <div className="flex min-h-[100dvh] items-center justify-center text-[15px] text-muted">Loading…</div>;
  }
  if (auth.status !== "admin") return <SignInGate />;
  return <AdminFrame>{children}</AdminFrame>;
}

function SignInGate() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!password || busy) return;
          setBusy(true);
          setError("");
          try {
            if (!(await signInAdmin(password))) setError("Wrong password.");
          } catch {
            setError("Could not reach the server. Check your connection.");
          } finally {
            setBusy(false);
          }
        }}
        className="w-full max-w-[420px] rounded-[28px] border border-line bg-card p-8 text-center"
      >
        <span
          aria-hidden
          className="logo-mark mx-auto block h-[30px] w-[42px] text-fg"
          style={{ maskImage: `url(${brand.logo})`, WebkitMaskImage: `url(${brand.logo})` }}
        />
        <h1 className="mt-5 font-display text-[36px] leading-tight">{brand.name} Admin</h1>
        <p className="mt-2 text-[15px] text-muted">Enter the admin password.</p>
        <label htmlFor="admin-password" className="sr-only">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "admin-password-error" : undefined}
          className="mt-6 min-h-12 w-full rounded-[14px] border border-line-strong bg-bg px-4 text-[16px] outline-none focus:border-fg"
        />
        <button type="submit" disabled={busy || !password} className="btn btn-primary mt-4 w-full disabled:opacity-70">
          {busy ? "Checking…" : "Sign in"}
        </button>
        {error && (
          <p id="admin-password-error" role="alert" className="mt-3 flex items-center justify-center gap-2 text-[14px] text-danger">
            <ShieldAlert className="size-4 shrink-0" aria-hidden /> {error}
          </p>
        )}
        <Link href="/" className="mt-6 inline-flex min-h-10 items-center text-[14px] text-muted hover:text-fg">
          Back to website
        </Link>
      </form>
    </div>
  );
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const db = useDB();
  const newCount = db.requests.filter((r) => r.status === "new").length;

  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <div className="flex min-h-[100dvh] flex-col lg:flex-row">
      {/* Sidebar (desktop) / top bar (mobile) */}
      <aside className="border-b border-line bg-card lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:w-[248px] lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:py-6">
          <Link href="/admin" className="flex min-h-11 items-center gap-2.5">
            <span
              aria-hidden
              className="logo-mark h-[22px] w-[31px] text-fg"
              style={{ maskImage: `url(${brand.logo})`, WebkitMaskImage: `url(${brand.logo})` }}
            />
            <span className="text-[17px] font-semibold tracking-[-0.03em]">{brand.name}</span>
            <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-medium text-muted">Admin</span>
          </Link>
          <Link href="/" className="text-[13px] text-muted hover:text-fg lg:hidden">
            View site
          </Link>
        </div>
        <nav aria-label="Admin" className="overflow-x-auto px-3 pb-3 lg:flex-1 lg:overflow-visible lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {NAV.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={
                    "flex min-h-11 items-center gap-3 whitespace-nowrap rounded-[12px] px-3.5 text-[15px] transition-colors " +
                    (isActive(href) ? "bg-fg text-bg" : "text-soft hover:bg-raised hover:text-fg")
                  }
                >
                  <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
                  {label}
                  {href === "/admin/requests" && newCount > 0 && (
                    <span
                      className={
                        "ml-auto rounded-full px-2 text-[12px] font-semibold " +
                        (isActive(href) ? "bg-accent text-ink" : "bg-accent-wash text-accent-text")
                      }
                    >
                      {newCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden border-t border-line p-4 lg:block">
          <Link href="/" className="flex min-h-10 items-center gap-1.5 text-[14px] text-muted hover:text-fg">
            View website <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-end gap-3 border-b border-line px-5 py-3 text-[13px] text-muted lg:px-10">
          <button type="button" onClick={() => void signOutAdmin()} className={btnSm + " min-h-9 border border-line-strong hover:border-faint"}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </div>
        <main id="main" className="px-5 pb-20 pt-8 lg:px-10 lg:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}
