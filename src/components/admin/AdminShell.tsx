"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ArrowUpRight, FolderKanban, Inbox, Info, LayoutDashboard, Wallet } from "lucide-react";
import { brand } from "@/config/site";
import { clearAll, loadSample, seedSampleOnFirstVisit, useDB } from "@/lib/store";
import { btnSm } from "@/components/admin/ui";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/requests", label: "Requests", icon: Inbox },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/finance", label: "Finance", icon: Wallet },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const db = useDB();
  const newCount = db.requests.filter((r) => r.status === "new").length;

  useEffect(() => {
    seedSampleOnFirstVisit();
  }, []);

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
        <div className="flex flex-col gap-3 border-b border-line bg-accent-wash/60 px-5 py-3 text-[13px] text-soft sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden />
            <span>
              Preview mode: data is saved in this browser only, and this page has no login yet. Website requests reach you on
              WhatsApp until the backend is connected.
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {db.sample ? (
              <button
                type="button"
                onClick={() => confirm("Remove the sample data and start empty?") && clearAll()}
                className={btnSm + " border border-line-strong bg-bg hover:border-faint"}
              >
                Clear sample data
              </button>
            ) : (
              <button type="button" onClick={loadSample} className={btnSm + " border border-line-strong bg-bg hover:border-faint"}>
                Load sample data
              </button>
            )}
          </div>
        </div>
        <main id="main" className="px-5 pb-20 pt-8 lg:px-10 lg:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}
