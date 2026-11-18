import type { Metadata } from "next";
import { RequestsView } from "@/components/admin/views";

export const metadata: Metadata = { title: "Requests" };

export default function AdminRequests() {
  return <RequestsView />;
}
