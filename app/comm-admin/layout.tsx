import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function CommAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["COMM_ADMIN", "ADMIN"].includes((session.user as any).role)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <Sidebar role={(session.user as any).role} userName={session.user.name!} userEmail={session.user.email!} />
      <div className="lg:mr-64">
        <Header title="ادمن التواصل" />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
