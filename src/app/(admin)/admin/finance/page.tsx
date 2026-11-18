import type { Metadata } from "next";
import { FinanceView } from "@/components/admin/finance";

export const metadata: Metadata = { title: "Finance" };

export default function AdminFinance() {
  return <FinanceView />;
}
