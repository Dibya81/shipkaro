"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, MessageCircle, X } from "lucide-react";
import { nav } from "@/config/site";
import { whatsappLink } from "@/lib/whatsapp";
import { Logo } from "@/components/Logo";

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
    <header className="sticky top-0 z-40 border-b border-line-soft bg-bg/85 backdrop-blur-md">
      <nav aria-label="Main" className="site-nav container-page flex h-[76px] items-center justify-between gap-4">
        <Logo onClick={close} />

        <div className="hidden items-center gap-7 text-[15px] md:flex">
          {nav.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex min-h-11 items-center text-soft transition-colors hover:text-fg"
            >
              {l.label}
            </Link>
          ))}
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary min-h-11 rounded-[10px] px-[18px] text-[15px]"
          >
            {nav.whatsappLabel}
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={nav.whatsappLabel}
            className="btn btn-primary size-11 min-h-11 rounded-[10px] px-0"
          >
            <MessageCircle className="size-5" strokeWidth={2} aria-hidden />
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-11 items-center justify-center rounded-[10px] border border-line-strong text-fg"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-line-soft bg-bg md:hidden"
      >
        <ul className="container-page flex flex-col py-3">
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
          <li className="pb-2 pt-3">
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
    </header>
  );
}
