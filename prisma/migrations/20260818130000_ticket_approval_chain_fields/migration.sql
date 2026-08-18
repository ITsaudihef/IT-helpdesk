-- Development-request intake fields: approval-chain change flag + justification, affected screen/permission
ALTER TABLE "tickets" ADD COLUMN "approvalChainChange" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tickets" ADD COLUMN "approvalChainJustification" TEXT;
ALTER TABLE "tickets" ADD COLUMN "affectedScreen" TEXT;
