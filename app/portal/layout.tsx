import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "USER") redirect("/dashboard");

  return (
    <div className="min-h-screen" style={{ background: "#F5F3FF" }} dir="rtl">
      <Sidebar
        role={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <div className="lg:mr-64">
        <Header title="بوابة المستخدم" />
        <main className="p-6 main-content">{children}</main>
      </div>
    </div>
  );
}
