import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { getSetting } from "@/lib/settings";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "USER") redirect("/dashboard");

  const roomsEnabled = await getSetting("rooms_enabled", "true") === "true";

  return (
    <div className="min-h-screen" style={{ background: "#F5F3FF" }} dir="rtl">
      <Sidebar
        role={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
        roomsEnabled={roomsEnabled}
      />
      <div className="lg:mr-64 overflow-x-hidden">
        <Header title="بوابة المستخدم" />
        <main className="p-4 sm:p-6 main-content">{children}</main>
      </div>
    </div>
  );
}
