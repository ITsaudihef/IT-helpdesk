import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { getSetting } from "@/lib/settings";
import MaintenancePage from "@/components/layout/MaintenancePage";

export default async function CeoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "CEO" && session.user.role !== "ADMIN") redirect("/dashboard");

  const maintenanceMode = await getSetting("maintenance_mode", "false").then((v) => v === "true");
  if (maintenanceMode && session.user.role !== "ADMIN") return <MaintenancePage />;

  return (
    <div className="min-h-screen" style={{ background: "#F3F7F1" }} dir="rtl">
      <Sidebar
        role={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <div className="lg:mr-64 overflow-x-hidden">
        <Header title="بوابة الرئيس التنفيذي" role={session.user.role} />
        <main className="p-4 sm:p-6 main-content">{children}</main>
      </div>
    </div>
  );
}
