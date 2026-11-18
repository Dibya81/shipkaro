"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, MessageCircle, X } from "lucide-react";
import { nav } from "@/config/site";
import { whatsappLink } from "@/lib/whatsapp";
import { Logo } from "@/components/Logo";

/** Floating pill navigation: a bordered bar that hovers over every section. */
export function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-nav sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto max-w-[1080px] rounded-2xl border border-line bg-bg/95 shadow-[0_8px_30px_-12px_rgb(60_60_20/0.18)] backdrop-blur-xl">
        <nav aria-label="Main" className="flex h-16 items-center justify-between gap-4 pl-4 pr-2 sm:pl-5">
          <Logo onClick={close} />

          <div className="hidden items-center gap-1 text-[15px] md:flex">
            {nav.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex min-h-11 items-center rounded-[10px] px-3.5 text-soft transition-colors hover:bg-raised hover:text-fg"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary ml-2 min-h-11 rounded-[12px] px-[18px] text-[15px]"
            >
              <MessageCircle className="size-[18px]" strokeWidth={2} aria-hidden />
              {nav.whatsappLabel}
            </a>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={nav.whatsappLabel}
              className="btn btn-primary size-11 min-h-11 rounded-[12px] px-0"
            >
              <MessageCircle className="size-5" strokeWidth={2} aria-hidden />
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="inline-flex size-11 items-center justify-center rounded-[12px] border border-line-strong text-fg"
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </nav>

        <div id="mobile-menu" hidden={!open} className="border-t border-line md:hidden">
          <ul className="flex flex-col px-4 py-2">
            {nav.links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={close}
                  className="flex min-h-12 items-center text-lg text-soft hover:text-fg"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pb-3 pt-2">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="btn btn-primary w-full"
              >
                <MessageCircle className="size-5" aria-hidden />
                {nav.whatsappLabel}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
