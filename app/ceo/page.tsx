import ExecutiveReportsClient from "@/components/reports/ExecutiveReportsClient";

export default function CeoReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "#16241D" }}>تقارير المشاريع</h1>
        <p className="text-sm mt-1" style={{ color: "#55705F" }}>نظرة شاملة على مشاريع كل إدارة ومستوى التقدم فيها</p>
      </div>
      <ExecutiveReportsClient />
    </div>
  );
}
