import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { statusLabel, typeLabel, priorityLabel, formatDate, formatDateShort } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/tickets/StatusBadge";
import Breadcrumb from "@/components/ui/Breadcrumb";
import TicketComments from "@/components/tickets/TicketComments";
import TicketAttachments from "@/components/tickets/TicketAttachments";
import TicketAuditLog from "@/components/tickets/TicketAuditLog";
import DeptManagerActions from "@/components/tickets/DeptManagerActions";

export default async function DeptManagerTicketDetail({ params }: { params: { id: string } }) {
  const session = await auth();
  const dept = session!.user.department as string;

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true, email: true, department: true } },
      assignedTo: { select: { name: true } },
      comments: {
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
    },
  });

  if (!ticket) notFound();

  // Only allow if ticket belongs to manager's department
  if (ticket.createdBy.department !== dept && session!.user.role !== "ADMIN") notFound();

  const canApprove = ticket.status === "PENDING_DEPT_APPROVAL";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb crumbs={[
        { label: "لوحة التحكم",  href: "/dept-manager" },
        { label: "تذاكر الإدارة", href: "/dept-manager/tickets" },
        { label: ticket.ticketNo },
      ]} />

      {/* Main card */}
      <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid #DCEAD9" }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-purple-600 mb-1">{ticket.ticketNo}</p>
            <h1 className="text-xl font-bold" style={{ color: "#16241D" }}>{ticket.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-4" style={{ color: "#374151" }}>{ticket.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-purple-100">
          <div>
            <p className="text-xs text-purple-500">المُرسل</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: "#16241D" }}>{ticket.createdBy.name}</p>
            <p className="text-xs text-purple-600">{ticket.createdBy.department}</p>
          </div>
          <div>
            <p className="text-xs text-purple-500">النوع</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: "#16241D" }}>{typeLabel[ticket.type]}</p>
          </div>
          <div>
            <p className="text-xs text-purple-500">الأولوية</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: "#16241D" }}>{priorityLabel[ticket.priority]}</p>
          </div>
          <div>
            <p className="text-xs text-purple-500">تاريخ الرفع</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: "#16241D" }}>{formatDate(ticket.createdAt)}</p>
          </div>
          {ticket.dueDate && (
            <div>
              <p className="text-xs text-purple-500">تاريخ التسليم المتوقع</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: "#16241D" }}>{formatDateShort(ticket.dueDate)}</p>
            </div>
          )}
        </div>

        {(ticket.approvalChainChange || ticket.affectedScreen) && (
          <div className="mt-4 pt-4 border-t border-purple-100 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-600">تعديل في سلسلة الاعتماد</span>
              <span className="font-semibold" style={{ color: ticket.approvalChainChange ? "#B45309" : "#16241D" }}>
                {ticket.approvalChainChange ? "نعم" : "لا"}
              </span>
            </div>
            {ticket.approvalChainChange && ticket.approvalChainJustification && (
              <div>
                <p className="text-xs text-purple-500 mb-1">المبرر</p>
                <p className="text-sm text-gray-700">{ticket.approvalChainJustification}</p>
              </div>
            )}
            {ticket.affectedScreen && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-600">الشاشة والصلاحية المتأثرة</span>
                <span className="font-semibold" style={{ color: "#16241D" }}>{ticket.affectedScreen}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approval actions — only shown when pending dept approval */}
      {canApprove && <DeptManagerActions ticketId={ticket.id} />}

      {/* Attachments */}
      <TicketAttachments ticketId={ticket.id} attachments={ticket.attachments.map(a => ({ ...a, uploadedAt: a.uploadedAt.toISOString() }))} canUpload={false} />

      {/* Comments */}
      <TicketComments
        ticketId={ticket.id}
        comments={ticket.comments as any}
        currentUserId={session!.user.id}
        userRole={session!.user.role}
      />

      {/* Audit log */}
      <TicketAuditLog ticketId={ticket.id} />
    </div>
  );
}
