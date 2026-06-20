CREATE TABLE "audit_logs" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "ticketId"  TEXT NOT NULL,
    "actorId"   TEXT,
    "action"    TEXT NOT NULL,
    "detail"    TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_actorId_fkey"  FOREIGN KEY ("actorId")  REFERENCES "users"   ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "audit_logs_ticketId_idx" ON "audit_logs"("ticketId");
