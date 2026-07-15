-- Durable idempotency ledger for retryable BullMQ email deliveries.
CREATE TABLE "email_job_deliveries" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_job_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_job_deliveries_jobId_key" ON "email_job_deliveries"("jobId");
CREATE INDEX "email_job_deliveries_status_idx" ON "email_job_deliveries"("status");
CREATE INDEX "email_job_deliveries_userId_idx" ON "email_job_deliveries"("userId");

ALTER TABLE "email_job_deliveries" ADD CONSTRAINT "email_job_deliveries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
