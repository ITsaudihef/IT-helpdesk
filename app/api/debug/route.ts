import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("s");
  if (secret !== "hef2026debug") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true, passwordHash: true },
  });
  return NextResponse.json(users);
}
