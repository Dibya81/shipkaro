import { ImageResponse } from "next/og";
import { iconElement } from "@/lib/brand-image";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(await iconElement(32), size);
}
