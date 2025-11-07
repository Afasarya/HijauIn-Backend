-- CreateEnum
CREATE TYPE "WasteCategory" AS ENUM ('ORGANIK', 'ANORGANIK', 'B3');

-- CreateTable
CREATE TABLE "waste_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "image_url" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waste_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waste_location_categories" (
    "id" TEXT NOT NULL,
    "waste_location_id" TEXT NOT NULL,
    "category" "WasteCategory" NOT NULL,

    CONSTRAINT "waste_location_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waste_location_categories_waste_location_id_category_key" ON "waste_location_categories"("waste_location_id", "category");

-- AddForeignKey
ALTER TABLE "waste_locations" ADD CONSTRAINT "waste_locations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_location_categories" ADD CONSTRAINT "waste_location_categories_waste_location_id_fkey" FOREIGN KEY ("waste_location_id") REFERENCES "waste_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
