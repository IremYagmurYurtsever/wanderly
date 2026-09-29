ALTER TABLE "trips" ADD COLUMN "country_code" VARCHAR(2);
ALTER TABLE "trips" ADD COLUMN "start_date" VARCHAR(10);
ALTER TABLE "trips" ADD COLUMN "end_date" VARCHAR(10);

CREATE TABLE "trip_stops" (
  "id" UUID NOT NULL PRIMARY KEY,
  "trip_id" UUID NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "kind" VARCHAR(10) NOT NULL,
  "place_id" VARCHAR(512) NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "address" VARCHAR(500) NOT NULL,
  "maps_url" VARCHAR(1000) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "trip_stops_trip_id_kind_place_id_key" ON "trip_stops"("trip_id", "kind", "place_id");
CREATE INDEX "trip_stops_trip_id_idx" ON "trip_stops"("trip_id");
