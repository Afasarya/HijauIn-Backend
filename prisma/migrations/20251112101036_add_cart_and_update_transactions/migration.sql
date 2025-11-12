/*
  Warnings:

  - A unique constraint covering the columns `[order_number]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'SHIPPED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';

-- Step 1: Add new columns as NULLABLE first (backward compatible)
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "order_number" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "total_amount" DOUBLE PRECISION;

-- Step 2: Generate order_number for existing transactions (if any)
UPDATE "transactions" 
SET "order_number" = 'ORD-' || EXTRACT(EPOCH FROM created_at)::TEXT || '-' || SUBSTRING(user_id, 1, 8)
WHERE "order_number" IS NULL;

-- Step 3: Copy amount to total_amount for existing transactions
UPDATE "transactions" 
SET "total_amount" = "amount"
WHERE "total_amount" IS NULL AND "amount" IS NOT NULL;

-- Step 4: Set default value for transactions without amount
UPDATE "transactions" 
SET "total_amount" = 0
WHERE "total_amount" IS NULL;

-- Step 5: Now make new columns NOT NULL (safe because all rows have values)
ALTER TABLE "transactions" ALTER COLUMN "order_number" SET NOT NULL;
ALTER TABLE "transactions" ALTER COLUMN "total_amount" SET NOT NULL;

-- Step 6: Create unique index on order_number
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_order_number_key" ON "transactions"("order_number");

-- Step 7: Create Cart tables
CREATE TABLE IF NOT EXISTS "carts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cart_items" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- Step 8: Create TransactionItem table
CREATE TABLE IF NOT EXISTS "transaction_items" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- Step 9: Create ShippingDetail table
CREATE TABLE IF NOT EXISTS "shipping_details" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_details_pkey" PRIMARY KEY ("id")
);

-- Step 10: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "carts_user_id_key" ON "carts"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_cart_id_product_id_key" ON "cart_items"("cart_id", "product_id");
CREATE UNIQUE INDEX IF NOT EXISTS "shipping_details_transaction_id_key" ON "shipping_details"("transaction_id");

-- Step 11: Add foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carts_user_id_fkey') THEN
        ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_cart_id_fkey') THEN
        ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" 
        FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_product_id_fkey') THEN
        ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" 
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transaction_items_transaction_id_fkey') THEN
        ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_fkey" 
        FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipping_details_transaction_id_fkey') THEN
        ALTER TABLE "shipping_details" ADD CONSTRAINT "shipping_details_transaction_id_fkey" 
        FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 12: Migrate existing transaction data to transaction_items (if any)
INSERT INTO "transaction_items" ("id", "transaction_id", "product_id", "product_name", "product_price", "quantity", "subtotal", "created_at")
SELECT 
    gen_random_uuid(),
    t.id,
    t.product_id,
    COALESCE(p.name, 'Unknown Product'),
    COALESCE(p.price, 0),
    COALESCE(t.quantity, 1),
    COALESCE(t.amount, 0),
    t.created_at
FROM "transactions" t
LEFT JOIN "products" p ON p.id = t.product_id
WHERE t.product_id IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM "transaction_items" ti WHERE ti.transaction_id = t.id
)
ON CONFLICT DO NOTHING;

-- Step 13: IMPORTANT - Keep old columns for backward compatibility
-- DO NOT DROP product_id, quantity, amount columns
-- Old code may still reference them
-- They will be deprecated gradually
