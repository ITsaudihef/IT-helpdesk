import { auth } from "@/lib/auth";
import ReportsClient from "@/components/reports/ReportsClient";

export default async function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold" style={{ color: "#1F1535" }}>لوحة التقارير</h1>
      <ReportsClient />
    </div>
  );
}
