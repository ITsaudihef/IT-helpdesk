import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TicketCard from "@/components/tickets/TicketCard";
import Pagination from "@/components/ui/Pagination";
import { Ticket } from "lucide-react";
import Link from "next/link";

const PER_PAGE = 20;

export default async function MyTicketsPage({ searchParams }: { searchParams: { page?: string } }) {
  const session = await auth();
  const page    = Math.max(1, parseInt(searchParams.page || "1"));
  const where   = { createdById: session!.user.id };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        assignedTo: { select: { name: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.ticket.count({ where }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: "#1F1535" }}>تذاكري ({total})</h1>
        <Link href="/portal/new"
          className="text-white px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
          + تذكرة جديدة
        </Link>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.15)" }}>
            <Ticket className="w-8 h-8" style={{ color: "#7C3AED" }} />
          </div>
          <h3 className="font-medium mb-1" style={{ color: "#1F1535" }}>لا توجد تذاكر</h3>
          <p className="text-sm text-purple-600">لم ترفع أي تذكرة حتى الآن</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} href={`/portal/tickets/${ticket.id}`} />
            ))}
          </div>
          <Pagination total={total} page={page} perPage={PER_PAGE} />
        </>
      )}
    </div>
  );
}
