import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TicketCard from "@/components/tickets/TicketCard";
import Pagination from "@/components/ui/Pagination";
import { Ticket } from "lucide-react";
import Link from "next/link";

const PER_PAGE = 20;

const STATUS_TABS = [
  { label: "الكل",                   value: "" },
  { label: "مفتوحة",                 value: "OPEN" },
  { label: "بانتظار اعتماد المدير",  value: "PENDING_DEPT_APPROVAL" },
  { label: "بانتظار اعتماد التقنية", value: "PENDING_APPROVAL" },
  { label: "قيد المعالجة",           value: "IN_PROGRESS" },
  { label: "بانتظار ردك",            value: "WAITING_INFO" },
  { label: "محلولة",                 value: "RESOLVED" },
];

export default async function MyTicketsPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const session = await auth();
  const page    = Math.max(1, parseInt(searchParams.page || "1"));
  const status  = searchParams.status || "";

  const where: any = { createdById: session!.user.id };
  if (status) where.status = status;

  const [tickets, total, waitingCount] = await Promise.all([
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
    prisma.ticket.count({ where: { createdById: session!.user.id, status: "WAITING_INFO" } }),
  ]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: "#1F1535" }}>تذاكري ({total})</h1>
        <Link href="/portal/new"
          className="text-white px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}>
          + تذكرة جديدة
        </Link>
      </div>

      {/* WAITING_INFO alert */}
      {waitingCount > 0 && !status && (
        <div className="rounded-xl p-3 flex items-center justify-between"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid #C4B5FD" }}>
          <p className="text-sm font-semibold" style={{ color: "#5B21B6" }}>
            ⚠️ {waitingCount} تذكرة بانتظار ردك — يُرجى الإجابة لاستمرار المعالجة
          </p>
          <Link href="?status=WAITING_INFO"
            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white whitespace-nowrap"
            style={{ background: "#7C3AED" }}>
            عرض الآن
          </Link>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map(tab => {
          const isActive = status === tab.value;
          const href = tab.value ? `?status=${tab.value}` : "?";
          return (
            <Link key={tab.value} href={href}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={isActive
                ? { background: "#7C3AED", color: "#fff" }
                : { background: "#F5F3FF", color: "#7C3AED" }}>
              {tab.label}
              {tab.value === "WAITING_INFO" && waitingCount > 0 && (
                <span className="mr-1.5 bg-red-500 text-white rounded-full text-[10px] px-1.5 py-0.5">
                  {waitingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {total === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "#FFFFFF", border: "1px solid #E9E3FF" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.15)" }}>
            <Ticket className="w-8 h-8" style={{ color: "#7C3AED" }} />
          </div>
          <h3 className="font-medium mb-1" style={{ color: "#1F1535" }}>لا توجد تذاكر</h3>
          <p className="text-sm" style={{ color: "#7C6A9E" }}>
            {status ? "لا توجد تذاكر بهذه الحالة" : "لم ترفع أي تذكرة حتى الآن"}
          </p>
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
