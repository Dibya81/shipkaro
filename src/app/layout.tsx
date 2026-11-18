import type { Metadata, Viewport } from "next";
import { EB_Garamond, Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { MotionProvider } from "@/components/MotionProvider";
import { brand, contact, seo } from "@/config/site";
import { instagramLink } from "@/lib/whatsapp";
import { DEFAULT_THEME, themeInitScript } from "@/lib/theme";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: { default: seo.title, template: `%s | ${brand.name}` },
  description: seo.description,
  keywords: seo.keywords,
  applicationName: brand.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: seo.title,
    description: seo.description,
    url: "/",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FFFFEB", // kept in sync with the active theme by lib/theme.ts
  colorScheme: "light dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: brand.name,
  slogan: brand.tagline,
  description: seo.description,
  url: brand.url,
  logo: `${brand.url}${brand.logo}`,
  email: contact.email,
  telephone: `+${contact.whatsappNumber}`,
  areaServed: "Worldwide",
  address: { "@type": "PostalAddress", addressCountry: "IN" },
  sameAs: [instagramLink],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is replaced before first paint by the inline script, hence suppressHydrationWarning.
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
      className={`${geist.variable} ${garamond.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-[100dvh] flex-col">
        <a
          href="#main"
          className="btn btn-primary fixed left-4 top-3 z-50 -translate-y-24 focus:translate-y-0"
        >
          Skip to content
        </a>
        <MotionProvider>
          {children}
        </MotionProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Analytics />
      </body>
    </html>
  );
}
