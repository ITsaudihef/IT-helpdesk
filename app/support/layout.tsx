import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "SUPPORT") redirect("/dashboard");

  return (
    <div className="min-h-screen" style={{ background: "#080820" }} dir="rtl">
      <Sidebar
        role={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <div className="lg:mr-64">
        <Header title="لوحة موظف الدعم" />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
