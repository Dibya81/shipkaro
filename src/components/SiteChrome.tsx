import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeRope } from "@/components/ThemeRope";

/** Header, theme rope and footer around a public page. The admin area has its own shell. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <ThemeRope />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
