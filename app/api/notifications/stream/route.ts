import { auth } from "@/lib/auth";
import { addSSEClient, removeSSEClient } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ctrl!: ReadableStreamDefaultController<any>;

  const stream = new ReadableStream({
    start(c) {
      ctrl = c;
      addSSEClient(userId, ctrl);
      c.enqueue(new TextEncoder().encode(": connected\n\n"));
    },
    cancel() {
      removeSSEClient(userId, ctrl);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
