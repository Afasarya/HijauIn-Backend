-- Drop waste_location_images table (not needed anymore)
DROP TABLE IF EXISTS "waste_location_images" CASCADE;

-- Add image_url field to waste_locations
ALTER TABLE "waste_locations" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
