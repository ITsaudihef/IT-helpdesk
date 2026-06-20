import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      createdAt: true,
      _count: { select: { ticketsCreated: true, ticketsAssigned: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
  const secret = req.headers.get("x-init-secret");
  if (secret !== "hef-init-2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const USERS = [
    {
      id:           "cmqh5aqbt000011waqbp5qkik",
      name:         "عبدالله الصقير",
      email:        "admin@helpdesk.com",
      passwordHash: "$2b$12$lcMs5nb0SOhh5yA5atJ1aeepgo2VsE3zzCbPyjR.EwvpREU5woHe2",
      role:         "ADMIN",
      department:   "تقنية المعلومات",
    },
    {
      id:           "cmqlkv4w90000lw9g4lzgfowj",
      name:         "test user",
      email:        "t@t.com",
      passwordHash: "$2b$10$sGf4LVmlcNkw.zUSRnBkMOQX7nzYYISyqr4qEwowK8jLjp8DefI42",
      role:         "USER",
      department:   "الخدمات المشتركة",
    },
    {
      id:           "cmqlkvsiz0001lw9gr5hjeh8f",
      name:         "test h",
      email:        "th@t.com",
      passwordHash: "$2b$12$cclv3q/29Lc7Vp3R3sPpPeQ2cCcVWB5MrL6dG8N40GxspdHzMJre6",
      role:         "SUPPORT",
      department:   "الخدمات المشتركة",
    },
  ];

  const results = [];
  for (const user of USERS) {
    const r = await prisma.user.upsert({
      where:  { email: user.email },
      update: { passwordHash: user.passwordHash, name: user.name, role: user.role },
      create: user,
    });
    results.push({ email: r.email, id: r.id });
  }
  return NextResponse.json({ ok: true, users: results });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, password, role, department } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: role || "USER", department },
    select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
