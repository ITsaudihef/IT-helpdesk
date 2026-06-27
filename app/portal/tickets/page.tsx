import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TicketCard from "@/components/tickets/TicketCard";
import { Ticket } from "lucide-react";
import Link from "next/link";

export default async function MyTicketsPage() {
  const session = await auth();
  const tickets = await prisma.ticket.findMany({
    where: { createdById: session!.user.id },
    include: {
      assignedTo: { select: { name: true } },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">تذاكري ({tickets.length})</h1>
        <Link
          href="/portal/new"
          className="text-white px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}
        >
          + تذكرة جديدة
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.15)" }}>
            <Ticket className="w-8 h-8" style={{ color: "#C4B5FD" }} />
          </div>
          <h3 className="font-medium text-white mb-1">لا توجد تذاكر</h3>
          <p className="text-sm text-purple-400">لم ترفع أي تذكرة حتى الآن</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} href={`/portal/tickets/${ticket.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
