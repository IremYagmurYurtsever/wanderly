ALTER TABLE "users" ADD COLUMN "phone" VARCHAR(16);

CREATE TABLE "visas" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "valid_from" VARCHAR(10) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "visas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "visas_duration_days_check" CHECK ("duration_days" BETWEEN 1 AND 3650)
);

CREATE INDEX "visas_user_id_idx" ON "visas"("user_id");
ALTER TABLE "visas" ADD CONSTRAINT "visas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
