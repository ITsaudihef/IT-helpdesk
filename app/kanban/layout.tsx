import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function KanbanLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [kanbanEnabled, roomsEnabled] = await Promise.all([
    getSetting("kanban_enabled", "true").then(v => v === "true"),
    getSetting("rooms_enabled",  "true").then(v => v === "true"),
  ]);

  if (!kanbanEnabled) redirect("/dashboard");

  return (
    <div className="min-h-screen" style={{ background: "#F5F3FF" }} dir="rtl">
      <Sidebar
        role={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
        roomsEnabled={roomsEnabled}
        kanbanEnabled={kanbanEnabled}
      />
      <div className="lg:mr-64 overflow-x-hidden">
        <Header title="لوحة المشاريع" />
        <main className="p-4 sm:p-6 main-content">{children}</main>
      </div>
    </div>
  );
}
