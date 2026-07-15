-- Store only hashed, short-lived email verification tokens.
ALTER TABLE "users" ADD COLUMN "emailVerificationTokenHash" TEXT;
ALTER TABLE "users" ADD COLUMN "emailVerificationTokenExpiresAt" TIMESTAMP(3);

CREATE INDEX "users_emailVerificationTokenHash_idx" ON "users"("emailVerificationTokenHash");
