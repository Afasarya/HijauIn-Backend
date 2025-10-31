-- CreateEnum
CREATE TYPE "WasteCategory" AS ENUM ('ORGANIK', 'ANORGANIK', 'B3');

-- CreateTable
CREATE TABLE "waste_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "category" "WasteCategory" NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waste_locations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "waste_locations" ADD CONSTRAINT "waste_locations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
