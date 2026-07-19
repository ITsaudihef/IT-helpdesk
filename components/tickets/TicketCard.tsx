import Link from "next/link";
import { cn, priorityColors, statusBadge, statusLabel, priorityLabel, priorityBadge, typeLabel } from "@/lib/utils";
import { MessageSquare, Paperclip, Clock, UserCheck, AlertCircle } from "lucide-react";

interface TicketCardProps {
  ticket: any;
  href: string;
}

export default function TicketCard({ ticket, href }: TicketCardProps) {
  const needsReply = ticket.status === "WAITING_INFO";
  return (
    <Link href={href}>
      <div
        className={cn(
          "rounded-xl border-r-4 border border-purple-100 bg-white p-4 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer",
          priorityColors[ticket.priority],
          needsReply && "ring-2 ring-purple-400"
        )}
      >
        {needsReply && (
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold px-2 py-1 rounded-lg w-fit"
            style={{ background: "rgba(124,58,237,0.12)", color: "#5B21B6" }}>
            <AlertCircle className="w-3 h-3" />
            بانتظار ردك
          </div>
        )}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-purple-500 mb-1">{ticket.ticketNo}</p>
            <h3 className="font-medium truncate" style={{ color: "#1F1535" }}>{ticket.title}</h3>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge[ticket.status])}>
              {statusLabel[ticket.status]}
            </span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full", priorityBadge[ticket.priority])}>
              {priorityLabel[ticket.priority]}
            </span>
          </div>
        </div>

        <p className="text-sm line-clamp-2 mb-3" style={{ color: "#6B6B8A" }}>{ticket.description}</p>

        <div className="flex items-center justify-between text-xs" style={{ color: "#7C6A9E" }}>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700">{typeLabel[ticket.type]}</span>
            {ticket.assignedTo && (
              <span className="flex items-center gap-1" style={{ color: "#7C3AED" }}>
                <UserCheck className="w-3 h-3" />
                {ticket.assignedTo.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {ticket._count?.comments > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {ticket._count.comments}
              </span>
            )}
            {ticket._count?.attachments > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {ticket._count.attachments}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(ticket.updatedAt ?? ticket.createdAt).toLocaleDateString("ar-SA", { calendar: "gregory" })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
