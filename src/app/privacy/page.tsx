import type { Metadata } from "next";
import { contact, privacyPage } from "@/config/site";
import { emailLink, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: privacyPage.title,
  description: privacyPage.intro,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="container-page pb-24 pt-14 sm:pt-[72px]">
      <div className="mx-auto flex max-w-[720px] flex-col gap-10">
        <header className="flex flex-col gap-4">
          <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-none tracking-[-0.04em]">
            {privacyPage.title}
          </h1>
          <p className="text-[17px] leading-relaxed text-muted">{privacyPage.intro}</p>
          <p className="text-sm text-faint">Last updated {privacyPage.updated}</p>
        </header>

        <div className="flex flex-col gap-4">
          {privacyPage.sections.map((s) => (
            <section key={s.heading} className="rounded-[20px] border border-line bg-card p-6 sm:p-7">
              <h2 className="font-display text-xl tracking-[-0.02em]">{s.heading}</h2>
              <p className="mt-2 leading-[1.7] text-muted">{s.body}</p>
            </section>
          ))}
        </div>

        <p className="leading-relaxed text-muted">
          Questions? Reach us on{" "}
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="text-fg underline decoration-accent underline-offset-4">
            WhatsApp
          </a>{" "}
          or at{" "}
          <a href={emailLink} className="text-fg underline decoration-accent underline-offset-4">
            {contact.email}
          </a>
          .
        </p>
      </div>
    </article>
  );
}
