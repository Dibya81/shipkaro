import type { Metadata } from "next";
import { startPage } from "@/config/site";
import { StartProject } from "@/components/start/StartProject";

export const metadata: Metadata = {
  title: startPage.eyebrow,
  description: startPage.subtext,
  alternates: { canonical: "/start" },
};

export default function StartPage() {
  return <StartProject />;
}
