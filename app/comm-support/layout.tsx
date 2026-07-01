import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { getSetting } from "@/lib/settings";

export default async function CommSupportLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["COMM_SUPPORT", "ADMIN"].includes((session.user as any).role)) redirect("/dashboard");

  const [roomsEnabled, kanbanEnabled] = await Promise.all([
    getSetting("rooms_enabled",  "true").then(v => v === "true"),
    getSetting("kanban_enabled", "true").then(v => v === "true"),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "#F5F3FF" }} dir="rtl">
      <Sidebar role={(session.user as any).role} userName={session.user.name!} userEmail={session.user.email!} roomsEnabled={roomsEnabled} kanbanEnabled={kanbanEnabled} />
      <div className="lg:mr-64 overflow-x-hidden">
        <Header title="دعم الاتصال المؤسسي" />
        <main className="p-4 sm:p-6 main-content">{children}</main>
      </div>
    </div>
  );
}
