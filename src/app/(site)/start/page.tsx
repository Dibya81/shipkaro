import type { Metadata } from "next";
import { startPage } from "@/config/site";
import { ProjectBuilder } from "@/components/start/ProjectBuilder";

export const metadata: Metadata = {
  title: startPage.eyebrow,
  // Shown in search results and link previews
  description: startPage.subtext,
  alternates: { canonical: "/start" },
};

export default function StartPage() {
  return <ProjectBuilder />;
}
