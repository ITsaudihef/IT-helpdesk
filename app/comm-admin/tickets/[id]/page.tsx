import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { typeLabel, priorityLabel, formatDate } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/tickets/StatusBadge";
import TicketComments from "@/components/tickets/TicketComments";
import TicketAttachments from "@/components/tickets/TicketAttachments";
import TicketAuditLog from "@/components/tickets/TicketAuditLog";
import CommAdminActions from "@/components/tickets/CommAdminActions";

export default async function CommAdminTicketPage({ params }: { params: { id: string } }) {
  const session = await auth();

  const [ticket, commSupportUsers] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { name: true, email: true, department: true } },
        assignedTo: { select: { id: true, name: true } },
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
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">{ticket.ticketNo} · تواصل مؤسسي</p>
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">{ticket.description}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div><p className="text-xs text-gray-400">المُرسل</p><p className="text-sm font-medium mt-0.5">{ticket.createdBy.name}</p></div>
          <div><p className="text-xs text-gray-400">القسم</p><p className="text-sm font-medium mt-0.5">{ticket.createdBy.department ?? "—"}</p></div>
          <div><p className="text-xs text-gray-400">المكلّف</p><p className="text-sm font-medium mt-0.5">{ticket.assignedTo?.name ?? "—"}</p></div>
          <div><p className="text-xs text-gray-400">تاريخ الرفع</p><p className="text-sm font-medium mt-0.5">{formatDate(ticket.createdAt)}</p></div>
        </div>
      </div>

      {/* Approve / Reject block — only when PENDING_APPROVAL */}
      <CommAdminActions
        ticketId={ticket.id}
        status={ticket.status}
        commSupportUsers={commSupportUsers}
      />

      <TicketAttachments ticketId={ticket.id} attachments={ticket.attachments as any} canUpload={false} />
      <TicketAuditLog ticketId={ticket.id} />
      <TicketComments ticketId={ticket.id} comments={ticket.comments as any} currentUserId={session!.user.id} userRole="ADMIN" />
    </div>
  );
}
