-- Add start and end dates to projects
ALTER TABLE "projects" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN "endDate" TIMESTAMP(3);
