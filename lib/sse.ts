// Global SSE client registry — works on Railway's single-instance Node process
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SSEController = ReadableStreamDefaultController<any>;

const clients = new Map<string, Set<SSEController>>();

export function addSSEClient(userId: string, ctrl: SSEController) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId)!.add(ctrl);
}

export function removeSSEClient(userId: string, ctrl: SSEController) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(ctrl);
  if (set.size === 0) clients.delete(userId);
}

export function pushToUser(userId: string, data: object) {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;
  const encoded = new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
  for (const ctrl of [...set]) {
    try {
      ctrl.enqueue(encoded);
    } catch {
      set.delete(ctrl);
    }
  }
}

function heartbeat() {
  const ping = new TextEncoder().encode(": ping\n\n");
  for (const [, set] of clients) {
    for (const ctrl of [...set]) {
      try { ctrl.enqueue(ping); }
      catch { set.delete(ctrl); }
    }
  }
}

// Keep Railway's proxy from closing idle SSE connections (proxy timeout is ~30s)
if (typeof setInterval !== "undefined") {
  setInterval(heartbeat, 25_000).unref?.();
}
