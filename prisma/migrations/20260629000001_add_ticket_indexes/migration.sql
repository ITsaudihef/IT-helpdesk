-- AddIndex
CREATE INDEX IF NOT EXISTS "tickets_status_idx" ON "tickets"("status");
CREATE INDEX IF NOT EXISTS "tickets_priority_idx" ON "tickets"("priority");
CREATE INDEX IF NOT EXISTS "tickets_type_idx" ON "tickets"("type");
CREATE INDEX IF NOT EXISTS "tickets_createdById_idx" ON "tickets"("createdById");
CREATE INDEX IF NOT EXISTS "tickets_assignedToId_idx" ON "tickets"("assignedToId");
CREATE INDEX IF NOT EXISTS "tickets_createdAt_idx" ON "tickets"("createdAt");
