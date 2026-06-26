import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function CommAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["COMM_ADMIN", "ADMIN"].includes((session.user as any).role)) redirect("/dashboard");

  return (
    <div className="min-h-screen" style={{ background: "#080820" }} dir="rtl">
      <Sidebar role={(session.user as any).role} userName={session.user.name!} userEmail={session.user.email!} />
      <div className="lg:mr-64">
        <Header title="ادمن الاتصال المؤسسي" />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
