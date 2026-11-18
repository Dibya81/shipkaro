import Link from "next/link";
import { brand, contact, footer, nav } from "@/config/site";
import { emailLink, instagramLink, whatsappLink } from "@/lib/whatsapp";
import { Year } from "@/components/Year";
import { SoundToggle } from "@/components/SoundToggle";

const linkClass = "inline-flex min-h-10 items-center text-soft transition-colors hover:text-fg";

export function Footer() {
  const contactLinks = [
    { label: "WhatsApp", href: whatsappLink(), external: true },
    { label: "Instagram", href: instagramLink, external: true },
    { label: contact.email, href: emailLink, external: false },
  ];
  return (
    <footer className="overflow-x-clip">
      <div className="container-page grid grid-cols-1 gap-12 pb-10 pt-24 md:grid-cols-[1.4fr_1fr_1fr]">
        <p className="max-w-[34ch] font-display text-[28px] leading-[1.15] tracking-[-0.01em]">{footer.blurb}</p>

        <nav aria-label="Footer">
          <h2 className="text-[13px] font-medium text-faint">{footer.columns.explore}</h2>
          <ul className="mt-3 flex flex-col">
            {nav.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/start" className={linkClass}>
                Start a project
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-[13px] font-medium text-faint">{footer.columns.contact}</h2>
          <ul className="mt-3 flex flex-col">
            {contactLinks.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={linkClass}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container-page" aria-hidden>
        <div className="flex select-none items-center gap-[2.5vw] text-fg">
          <span
            className="logo-mark aspect-[37/26] w-[15vw] max-w-[200px] shrink-0"
            style={{ maskImage: `url(${brand.logo})`, WebkitMaskImage: `url(${brand.logo})` }}
          />
          <span className="whitespace-nowrap text-[clamp(56px,16.5vw,236px)] font-bold leading-[0.9] tracking-[-0.06em]">
            {brand.name}
          </span>
        </div>
      </div>

      <div className="container-page flex flex-col gap-3 py-8 text-sm text-faint sm:flex-row sm:items-center sm:justify-between">
        <span>
          © <Year /> {brand.name}
        </span>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="inline-flex min-h-11 items-center transition-colors hover:text-fg">
            {footer.privacyLabel}
          </Link>
          <SoundToggle />
        </div>
      </div>
    </footer>
  );
}
