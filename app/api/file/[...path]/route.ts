import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif",  ".webp": "image/webp", ".pdf": "application/pdf",
  ".doc":  "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls":  "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const UPLOAD_BASE = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
  const filePath    = params.path.join("/");
  const fullPath    = path.resolve(path.join(UPLOAD_BASE, filePath));

  // Security: prevent path traversal
  if (!fullPath.startsWith(path.resolve(UPLOAD_BASE))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!existsSync(fullPath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const buffer      = await readFile(fullPath);
  const ext         = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

  return new NextResponse(buffer, {
    headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" },
  });
}
