import type { MetadataRoute } from "next";
import { brand } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${brand.url}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${brand.url}/start`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${brand.url}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
