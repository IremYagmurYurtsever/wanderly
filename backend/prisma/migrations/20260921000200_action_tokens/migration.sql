CREATE TYPE "ActionKind" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');
CREATE TABLE "action_tokens" (
  "id" UUID NOT NULL,
  "token_hash" VARCHAR(64) NOT NULL,
  "kind" "ActionKind" NOT NULL,
  "user_id" UUID NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "action_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "action_tokens_token_hash_key" ON "action_tokens"("token_hash");
CREATE INDEX "action_tokens_user_id_kind_idx" ON "action_tokens"("user_id", "kind");
CREATE INDEX "action_tokens_expires_at_idx" ON "action_tokens"("expires_at");
ALTER TABLE "action_tokens" ADD CONSTRAINT "action_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
