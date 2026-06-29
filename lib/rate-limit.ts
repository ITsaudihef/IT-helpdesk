const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000;

/** Returns true if the action is allowed, false if the key has exceeded maxAttempts within the window. */
export function checkRateLimit(key: string, maxAttempts: number): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= maxAttempts) return false;

  entry.count++;
  return true;
}

export function resetRateLimit(key: string) {
  attempts.delete(key);
}

// Periodic cleanup so the map doesn't grow unbounded over the process lifetime.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now > entry.resetAt) attempts.delete(key);
  }
}, WINDOW_MS).unref?.();
