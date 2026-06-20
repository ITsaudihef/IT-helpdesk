import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const logs = await prisma.auditLog.findMany({
    where: { ticketId: params.id },
    include: { actor: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(logs);
}
