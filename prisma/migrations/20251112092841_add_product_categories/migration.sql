/*
  Warnings:

  - You are about to drop the column `category` on the `products` table. All the data in the column will be lost.
  - Added the required column `category_id` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Create product_categories table first
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create unique index on name
CREATE UNIQUE INDEX "product_categories_name_key" ON "product_categories"("name");

-- Step 3: Insert default category for existing products
INSERT INTO "product_categories" ("id", "name", "description", "created_at", "updated_at")
VALUES (
    'default-category-migration',
    'Uncategorized',
    'Default category for existing products during migration',
    NOW(),
    NOW()
)
ON CONFLICT ("name") DO NOTHING;

-- Step 4: Add category_id column as NULLABLE first
ALTER TABLE "products" ADD COLUMN "category_id" TEXT;

-- Step 5: Set default category_id for all existing products
UPDATE "products" 
SET "category_id" = 'default-category-migration' 
WHERE "category_id" IS NULL;

-- Step 6: Now make category_id NOT NULL (safe because all rows have value now)
ALTER TABLE "products" ALTER COLUMN "category_id" SET NOT NULL;

-- Step 7: Add foreign key constraint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" 
FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: Drop old category column (safe now)
ALTER TABLE "products" DROP COLUMN IF EXISTS "category";
