import { auth } from "@/lib/auth";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { statusLabel, typeLabel, priorityLabel, formatDate } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/tickets/StatusBadge";
import TicketComments from "@/components/tickets/TicketComments";
import TicketRating from "@/components/tickets/TicketRating";
import TicketAttachments from "@/components/tickets/TicketAttachments";
import TicketAuditLog from "@/components/tickets/TicketAuditLog";
import UserTestActions from "@/components/tickets/UserTestActions";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true, email: true, department: true } },
      assignedTo: { select: { name: true, email: true } },
      comments: {
        where: { isInternal: false },
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
    },
  });

  if (!ticket || ticket.createdById !== session!.user.id) notFound();

  const timelineEvents = [
    { date: ticket.createdAt, label: "تم رفع التذكرة", color: "bg-blue-500" },
    ...(ticket.assignedTo ? [{ date: ticket.updatedAt, label: `تم التكليف إلى ${ticket.assignedTo.name}`, color: "bg-purple-500" }] : []),
    ...(ticket.resolvedAt ? [{ date: ticket.resolvedAt, label: "تم الحل", color: "bg-green-500" }] : []),
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb crumbs={[{ label: "الرئيسية", href: "/portal" }, { label: "تذاكري", href: "/portal/tickets" }, { label: ticket.ticketNo }]} />
      {/* Header */}
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-purple-100">
          <div>
            <p className="text-xs text-purple-500">النوع</p>
            <p className="text-sm font-medium mt-0.5">{typeLabel[ticket.type]}</p>
          </div>
          <div>
            <p className="text-xs text-purple-500">المسند إلى</p>
            <p className="text-sm font-medium mt-0.5">{ticket.assignedTo?.name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-purple-500">تاريخ الرفع</p>
            <p className="text-sm font-medium mt-0.5">{formatDate(ticket.createdAt)}</p>
          </div>
          {ticket.resolvedAt && (
            <div>
              <p className="text-xs text-purple-500">تاريخ الحل</p>
              <p className="text-sm font-medium mt-0.5">{formatDate(ticket.resolvedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
        <h2 className="font-semibold mb-4" style={{ color: "#1F1535" }}>مسار التذكرة</h2>
        <div className="space-y-3">
          {timelineEvents.map((e, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${e.color}`} />
              <div className="flex-1 flex items-center justify-between">
                <p className="text-sm text-gray-700">{e.label}</p>
                <p className="text-xs text-purple-500">{formatDate(e.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User test action */}
      {ticket.status === "PENDING_USER_TEST" && <UserTestActions ticketId={ticket.id} />}

      {/* Attachments */}
      <TicketAttachments
        ticketId={ticket.id}
        attachments={ticket.attachments as any}
        canUpload={!["CLOSED", "LAUNCHED"].includes(ticket.status)}
      />

      {/* Rating if closed */}
      {["RESOLVED", "CLOSED", "LAUNCHED"].includes(ticket.status) && (
        <TicketRating ticketId={ticket.id} currentRating={ticket.rating} />
      )}

      {/* Audit Log */}
      <TicketAuditLog ticketId={ticket.id} />

      {/* Comments */}
      <TicketComments
        ticketId={ticket.id}
        comments={ticket.comments as any}
        currentUserId={session!.user.id}
        userRole="USER"
      />
    </div>
  );
}
