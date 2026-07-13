ALTER TABLE "refresh_tokens" ADD COLUMN "familyId" TEXT;
UPDATE "refresh_tokens" SET "familyId" = "id" WHERE "familyId" IS NULL;
ALTER TABLE "refresh_tokens" ALTER COLUMN "familyId" SET NOT NULL;
ALTER TABLE "refresh_tokens" ADD COLUMN "replacedByTokenId" TEXT;
ALTER TABLE "refresh_tokens" ADD COLUMN "lastUsedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "refresh_tokens_replacedByTokenId_key" ON "refresh_tokens"("replacedByTokenId");
CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");