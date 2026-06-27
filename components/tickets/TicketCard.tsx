import Link from "next/link";
import { cn, priorityColors, statusBadge, statusLabel, priorityLabel, priorityBadge, typeLabel } from "@/lib/utils";
import { MessageSquare, Paperclip, Clock } from "lucide-react";

interface TicketCardProps {
  ticket: any;
  href: string;
}

export default function TicketCard({ ticket, href }: TicketCardProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "rounded-xl border-r-4 border border-white/8 p-4 hover:border-purple-500/30 transition-all cursor-pointer",
          priorityColors[ticket.priority]
        )}
        style={{ background: "#100835" }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-purple-400 mb-1">{ticket.ticketNo}</p>
            <h3 className="font-medium text-white truncate">{ticket.title}</h3>
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

        <p className="text-sm text-purple-300 line-clamp-2 mb-3">{ticket.description}</p>

        <div className="flex items-center justify-between text-xs text-purple-400">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#C4B5FD" }}>{typeLabel[ticket.type]}</span>
            {ticket.assignedTo && (
              <span className="text-purple-400">← {ticket.assignedTo.name}</span>
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
              {new Date(ticket.createdAt).toLocaleDateString("ar-SA")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
