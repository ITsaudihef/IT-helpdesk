import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { statusLabel, typeLabel, priorityLabel, formatDate } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/tickets/StatusBadge";
import TicketComments from "@/components/tickets/TicketComments";
import TicketAttachments from "@/components/tickets/TicketAttachments";
import TicketAuditLog from "@/components/tickets/TicketAuditLog";
import SupportTicketActions from "@/components/tickets/SupportTicketActions";

export default async function CommSupportTicketPage({ params }: { params: { id: string } }) {
  const session = await auth();

  const [ticket, commSupportUsers] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { name: true, email: true, department: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        comments: {
          include: { author: { select: { name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "COMM_SUPPORT" },
      select: { id: true, name: true },
    }),
  ]);

  if (!ticket) notFound();
  if (ticket.type !== "INSTITUTIONAL_COMM") notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-purple-600 mb-1">{ticket.ticketNo}</p>
            <h1 className="text-xl font-bold" style={{ color: "#1F1535" }}>{ticket.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#374151" }}>{ticket.description}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
          <div><p className="text-xs text-purple-500">المُرسل</p><p className="text-sm font-medium mt-0.5">{ticket.createdBy.name}</p></div>
          <div><p className="text-xs text-purple-500">القسم</p><p className="text-sm font-medium mt-0.5">{ticket.createdBy.department ?? "—"}</p></div>
          <div><p className="text-xs text-purple-500">تاريخ الرفع</p><p className="text-sm font-medium mt-0.5">{formatDate(ticket.createdAt)}</p></div>
        </div>
      </div>

      <SupportTicketActions ticket={ticket as any} supportUsers={commSupportUsers} currentUserId={session!.user.id} />
      <TicketAttachments ticketId={ticket.id} attachments={ticket.attachments as any} canUpload={false} />
      <TicketAuditLog ticketId={ticket.id} />
      <TicketComments ticketId={ticket.id} comments={ticket.comments as any} currentUserId={session!.user.id} userRole="SUPPORT" />
    </div>
  );
}
