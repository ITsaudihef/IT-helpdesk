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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + تذكرة جديدة
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-white/8 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-purple-500" />
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
