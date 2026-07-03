-- Add inventory log relations for variant-level adjustments and actor traceability.
ALTER TABLE "inventory_logs" ADD COLUMN "variantId" TEXT;

CREATE INDEX "inventory_logs_variantId_idx" ON "inventory_logs"("variantId");
CREATE INDEX "inventory_logs_actorUserId_idx" ON "inventory_logs"("actorUserId");

ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "product_variants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
