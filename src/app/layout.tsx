import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionProvider } from "@/components/MotionProvider";
import { ThemeRope } from "@/components/ThemeRope";
import { brand, contact, seo } from "@/config/site";
import { instagramLink } from "@/lib/whatsapp";
import { DEFAULT_THEME, themeInitScript } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
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
  themeColor: "#F5F5F2", // kept in sync with the active theme by lib/theme.ts
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
      className={`${inter.variable} ${spaceGrotesk.variable}`}
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
          <Header />
          <ThemeRope />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
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
