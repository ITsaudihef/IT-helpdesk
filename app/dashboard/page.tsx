import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role;
  if (role === "ADMIN")        redirect("/admin");
  if (role === "SUPPORT")      redirect("/support");
  if (role === "COMM_SUPPORT") redirect("/comm-support");
  if (role === "COMM_ADMIN")   redirect("/comm-admin");
  if (role === "DEPT_MANAGER") redirect("/dept-manager");
  redirect("/portal");
}
