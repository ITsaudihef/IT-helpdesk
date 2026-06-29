import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setSetting } from "@/lib/settings";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, value } = await req.json();
  if (!key || value === undefined)
    return NextResponse.json({ error: "key and value required" }, { status: 400 });

  await setSetting(String(key), String(value));
  return NextResponse.json({ ok: true });
}
