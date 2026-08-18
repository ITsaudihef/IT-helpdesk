-- Add expected delivery date for tickets (set by support/admin on DEVELOPMENT tickets)
ALTER TABLE "tickets" ADD COLUMN "dueDate" TIMESTAMP(3);
