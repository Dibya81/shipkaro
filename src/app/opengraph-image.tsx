import { ImageResponse } from "next/og";
import { brand, hero, seo } from "@/config/site";
import { brandFonts, logoDataUri } from "@/lib/brand-image";

export const alt = seo.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [logo, fonts] = await Promise.all([logoDataUri(), brandFonts()]);
  const host = new URL(brand.url).host;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0A0A0B",
          color: "#F5F5F2",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={logo} width={68} height={48} alt="" />
          <span style={{ fontFamily: "Space Grotesk", fontSize: 40, letterSpacing: "-0.03em" }}>
            {brand.name}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: "Space Grotesk",
            fontSize: 132,
            lineHeight: 0.98,
            letterSpacing: "-0.045em",
          }}
        >
          <span>{hero.headlineLine1}</span>
          <span style={{ color: "#FF6A2B" }}>{hero.headlineLine2}</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #232328",
            paddingTop: 28,
            fontSize: 26,
            color: "#A1A1AA",
          }}
        >
          <span>Custom software, apps, websites and automation.</span>
          <span style={{ color: "#F5F5F2" }}>{host}</span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
