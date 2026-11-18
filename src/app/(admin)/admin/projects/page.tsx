import type { Metadata } from "next";
import { ProjectsView } from "@/components/admin/views";

export const metadata: Metadata = { title: "Projects" };

export default function AdminProjects() {
  return <ProjectsView />;
}
