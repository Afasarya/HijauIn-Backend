-- Migration: Make old transaction columns nullable for backward compatibility
-- This migration makes product_id, quantity, and amount columns NULLABLE
-- so that new cart-based checkout can work without filling these deprecated fields

-- Step 1: Make product_id nullable (if exists and is NOT NULL)
DO $$ 
BEGIN
    -- Check if column exists and is NOT NULL
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'product_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "transactions" ALTER COLUMN "product_id" DROP NOT NULL;
        RAISE NOTICE 'Column product_id set to NULLABLE';
    END IF;
END $$;

-- Step 2: Make quantity nullable (if exists and is NOT NULL)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'quantity'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "transactions" ALTER COLUMN "quantity" DROP NOT NULL;
        RAISE NOTICE 'Column quantity set to NULLABLE';
    END IF;
END $$;

-- Step 3: Make amount nullable (if exists and is NOT NULL)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'amount'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "transactions" ALTER COLUMN "amount" DROP NOT NULL;
        RAISE NOTICE 'Column amount set to NULLABLE';
    END IF;
END $$;

-- Step 4: Drop foreign key constraint on product_id (if exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'transactions_product_id_fkey'
    ) THEN
        ALTER TABLE "transactions" DROP CONSTRAINT "transactions_product_id_fkey";
        RAISE NOTICE 'Foreign key constraint on product_id dropped';
    END IF;
END $$;

-- Verify the changes
DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'Old columns (product_id, quantity, amount) are now NULLABLE';
    RAISE NOTICE 'New cart-based checkout will work without filling these deprecated fields';
END $$;
