-- Add seller payout tracking for multi-vendor payment settlement.
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "paymentId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "providerRef" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payouts_providerRef_key" ON "payouts"("providerRef");
CREATE INDEX "payouts_storeId_idx" ON "payouts"("storeId");
CREATE INDEX "payouts_paymentId_idx" ON "payouts"("paymentId");
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

ALTER TABLE "payouts" ADD CONSTRAINT "payouts_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "payments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
