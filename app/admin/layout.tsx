import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen" style={{ background: "#F5F3FF" }} dir="rtl">
      <Sidebar
        role={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <div className="lg:mr-64 overflow-x-hidden">
        <Header title="لوحة الإدارة" />
        <main className="p-4 sm:p-6 main-content">{children}</main>
      </div>
    </div>
  );
}
