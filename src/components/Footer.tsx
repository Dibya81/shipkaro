import Link from "next/link";
import { brand, contact, footer } from "@/config/site";
import { emailLink, instagramLink, whatsappLink } from "@/lib/whatsapp";
import { Year } from "@/components/Year";
import { SoundToggle } from "@/components/SoundToggle";

export function Footer() {
  const links = [
    { label: "Instagram", href: instagramLink, external: true },
    { label: "WhatsApp", href: whatsappLink(), external: true },
    { label: contact.email, href: emailLink, external: false },
  ];
  return (
    <footer className="border-t border-line-soft">
      <div className="container-page flex flex-col gap-6 py-10 text-sm text-faint md:flex-row md:items-center md:justify-between">
        <span className="font-display text-lg text-fg">{brand.name}</span>
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="inline-flex min-h-11 items-center text-soft transition-colors hover:text-fg"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center text-soft transition-colors hover:text-fg"
            >
              {footer.privacyLabel}
            </Link>
          </li>
          <li>
            <SoundToggle />
          </li>
        </ul>
        <span>
          © <Year /> {brand.name}
        </span>
      </div>
    </footer>
  );
}
