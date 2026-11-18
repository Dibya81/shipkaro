import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { brand } from "@/config/site";

/*
 * Files are read once at module load (build time), not per request, so the
 * icon and social-image routes are prerendered as static files.
 */
const logoFile = readFile(join(process.cwd(), "public", brand.logo.replace(/^\//, "")));
const displayFont = readFile(
  join(process.cwd(), "node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff")
);
const bodyFont = readFile(
  join(process.cwd(), "node_modules/@fontsource/inter/files/inter-latin-400-normal.woff")
);

/** public/logo.svg as a data URI, so every generated icon/social image follows the one logo file. */
export async function logoDataUri() {
  return `data:image/svg+xml;base64,${(await logoFile).toString("base64")}`;
}

export async function brandFonts() {
  const [display, body] = await Promise.all([displayFont, bodyFont]);
  return [
    { name: "Space Grotesk", data: display, weight: 700 as const, style: "normal" as const },
    { name: "Inter", data: body, weight: 400 as const, style: "normal" as const },
  ];
}

/** Square app icon: logo mark centred on the ink background. */
export async function iconElement(size: number) {
  const logo = await logoDataUri();
  const w = Math.round(size * 0.74);
  const h = Math.round((w * 48) / 68);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0B",
        borderRadius: size >= 128 ? 0 : Math.round(size * 0.22),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} width={w} height={h} alt="" />
    </div>
  );
}
