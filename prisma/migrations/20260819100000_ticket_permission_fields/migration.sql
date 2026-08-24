-- New "PERMISSIONS" ticket type intake fields: delete/cancel action + permission name + holder contact details
ALTER TABLE "tickets" ADD COLUMN "permissionAction" TEXT;
ALTER TABLE "tickets" ADD COLUMN "permissionName" TEXT;
ALTER TABLE "tickets" ADD COLUMN "permissionHolderName" TEXT;
ALTER TABLE "tickets" ADD COLUMN "permissionHolderPhone" TEXT;
ALTER TABLE "tickets" ADD COLUMN "permissionHolderEmail" TEXT;
