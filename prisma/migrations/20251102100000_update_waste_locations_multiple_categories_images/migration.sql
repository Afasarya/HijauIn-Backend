-- Drop old category column from waste_locations
ALTER TABLE "waste_locations" DROP COLUMN IF EXISTS "category";

-- Add new columns to waste_locations
ALTER TABLE "waste_locations" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "waste_locations" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have updated_at = created_at
UPDATE "waste_locations" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;

-- CreateTable for waste_location_categories
CREATE TABLE IF NOT EXISTS "waste_location_categories" (
    "id" TEXT NOT NULL,
    "waste_location_id" TEXT NOT NULL,
    "category" "WasteCategory" NOT NULL,

    CONSTRAINT "waste_location_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable for waste_location_images
CREATE TABLE IF NOT EXISTS "waste_location_images" (
    "id" TEXT NOT NULL,
    "waste_location_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waste_location_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (drop first if exists)
DROP INDEX IF EXISTS "waste_location_categories_waste_location_id_category_key";
CREATE UNIQUE INDEX "waste_location_categories_waste_location_id_category_key" ON "waste_location_categories"("waste_location_id", "category");

-- AddForeignKey (check if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'waste_location_categories_waste_location_id_fkey'
    ) THEN
        ALTER TABLE "waste_location_categories" ADD CONSTRAINT "waste_location_categories_waste_location_id_fkey" 
        FOREIGN KEY ("waste_location_id") REFERENCES "waste_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'waste_location_images_waste_location_id_fkey'
    ) THEN
        ALTER TABLE "waste_location_images" ADD CONSTRAINT "waste_location_images_waste_location_id_fkey" 
        FOREIGN KEY ("waste_location_id") REFERENCES "waste_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
