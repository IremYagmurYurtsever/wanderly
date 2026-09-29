BEGIN;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'TRY';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "journal_favorites" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS "trips" (
  "id" UUID NOT NULL PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "destination" VARCHAR(200) NOT NULL,
  "dates" VARCHAR(100) NOT NULL,
  "custom" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "budget" VARCHAR(50),
  "currency" VARCHAR(10),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "trips_user_id_idx" ON "trips"("user_id");
CREATE TABLE IF NOT EXISTS "memories" (
  "id" UUID NOT NULL PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "trip_id" UUID REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "text" TEXT NOT NULL,
  "is_favorite" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "memories_user_id_idx" ON "memories"("user_id");
CREATE INDEX IF NOT EXISTS "memories_trip_id_idx" ON "memories"("trip_id");
CREATE TABLE IF NOT EXISTS "saved_places" (
  "id" UUID NOT NULL PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "place_id" VARCHAR(100) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "saved_places_user_id_place_id_key" ON "saved_places"("user_id", "place_id");
CREATE INDEX IF NOT EXISTS "saved_places_user_id_idx" ON "saved_places"("user_id");

DELETE FROM "action_tokens" WHERE "kind" = 'VERIFY_EMAIL';
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified_at";
ALTER TYPE "ActionKind" RENAME TO "ActionKind_old";
CREATE TYPE "ActionKind" AS ENUM ('RESET_PASSWORD');
ALTER TABLE "action_tokens" ALTER COLUMN "kind" TYPE "ActionKind" USING ("kind"::text::"ActionKind");
DROP TYPE "ActionKind_old";
COMMIT;
