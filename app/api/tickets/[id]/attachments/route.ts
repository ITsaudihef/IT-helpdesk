import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED  = ["image/jpeg","image/png","image/gif","image/webp","application/pdf",
  "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });

  // Users can only upload to their own tickets; support/admin can upload to any
  if (session.user.role === "USER" && ticket.createdById !== session.user.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "لم يتم إرسال أي ملف" }, { status: 400 });

  const UPLOAD_BASE  = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
  const FILE_PREFIX  = process.env.UPLOAD_DIR ? "/api/file" : "/uploads";
  const uploadDir    = path.join(UPLOAD_BASE, params.id);
  await mkdir(uploadDir, { recursive: true });

  const created = [];
  for (const file of files) {
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: `الملف ${file.name} يتجاوز الحد الأقصى 10MB` }, { status: 400 });
    if (!ALLOWED.includes(file.type))
      return NextResponse.json({ error: `نوع الملف ${file.name} غير مدعوم` }, { status: 400 });

    const ext      = path.extname(file.name);
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const bytes    = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, safeName), Buffer.from(bytes));

    const attachment = await prisma.attachment.create({
      data: {
        ticketId: params.id,
        fileName: file.name,
        fileUrl:  `${FILE_PREFIX}/${params.id}/${safeName}`,
      },
    });
    created.push(attachment);
  }

  return NextResponse.json(created, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const attachments = await prisma.attachment.findMany({
    where: { ticketId: params.id },
    orderBy: { uploadedAt: "asc" },
  });
  return NextResponse.json(attachments);
}
