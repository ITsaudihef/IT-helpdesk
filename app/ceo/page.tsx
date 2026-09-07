import ExecutiveReportsClient from "@/components/reports/ExecutiveReportsClient";

export default function CeoReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "#16241D" }}>تقارير الإدارات</h1>
        <p className="text-sm mt-1" style={{ color: "#55705F" }}>نظرة شاملة على سير عمل التذاكر في جميع الإدارات</p>
      </div>
      <ExecutiveReportsClient />
    </div>
  );
}
