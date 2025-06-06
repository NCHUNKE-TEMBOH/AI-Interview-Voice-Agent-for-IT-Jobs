-- =====================================================
-- ADD GUEST INTERVIEW SUPPORT
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add guest support column to Interviews table
DO $$
BEGIN
    -- Add is_guest column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Interviews' AND column_name = 'is_guest'
    ) THEN
        ALTER TABLE "Interviews" ADD COLUMN is_guest BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_guest column to Interviews table';
    ELSE
        RAISE NOTICE 'is_guest column already exists in Interviews table';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Interviews' AND column_name = 'status'
    ) THEN
        ALTER TABLE "Interviews" ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added status column to Interviews table';
    ELSE
        RAISE NOTICE 'status column already exists in Interviews table';
    END IF;

    -- Add completed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Interviews' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE "Interviews" ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added completed_at column to Interviews table';
    ELSE
        RAISE NOTICE 'completed_at column already exists in Interviews table';
    END IF;

    -- Add response_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Interviews' AND column_name = 'response_count'
    ) THEN
        ALTER TABLE "Interviews" ADD COLUMN response_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added response_count column to Interviews table';
    ELSE
        RAISE NOTICE 'response_count column already exists in Interviews table';
    END IF;
END $$;

-- 2. Create index for guest interviews (for better performance)
DO $$
BEGIN
    -- Create index on is_guest column
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'Interviews' AND indexname = 'idx_interviews_is_guest'
    ) THEN
        CREATE INDEX idx_interviews_is_guest ON "Interviews"(is_guest);
        RAISE NOTICE 'Created index on is_guest column';
    ELSE
        RAISE NOTICE 'Index on is_guest column already exists';
    END IF;
END $$;

-- 3. Update RLS policies for guest interviews (if RLS is enabled)
DO $$
BEGIN
    -- Check if RLS is enabled on Interviews table
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'Interviews' AND rowsecurity = true
    ) THEN
        -- Create policy for guest interviews
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'Interviews' AND policyname = 'Allow guest interview access'
        ) THEN
            CREATE POLICY "Allow guest interview access" ON "Interviews"
            FOR ALL
            USING (is_guest = true);
            RAISE NOTICE 'Created RLS policy for guest interviews';
        ELSE
            RAISE NOTICE 'Guest interview RLS policy already exists';
        END IF;
    ELSE
        RAISE NOTICE 'RLS not enabled on Interviews table, skipping policy creation';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create RLS policy: %', SQLERRM;
END $$;

-- 4. Verify the setup
DO $$
DECLARE
    interviews_exists BOOLEAN;
    guest_column_exists BOOLEAN;
    status_column_exists BOOLEAN;
BEGIN
    -- Check if Interviews table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Interviews'
    ) INTO interviews_exists;
    
    -- Check if guest column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'Interviews' AND column_name = 'is_guest'
    ) INTO guest_column_exists;
    
    -- Check if status column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'Interviews' AND column_name = 'status'
    ) INTO status_column_exists;
    
    RAISE NOTICE '=== GUEST INTERVIEW SETUP VERIFICATION ===';
    RAISE NOTICE 'Interviews table exists: %', interviews_exists;
    RAISE NOTICE 'is_guest column exists: %', guest_column_exists;
    RAISE NOTICE 'status column exists: %', status_column_exists;
    
    IF interviews_exists AND guest_column_exists AND status_column_exists THEN
        RAISE NOTICE 'Guest interview support is ready!';
    ELSE
        RAISE NOTICE 'Guest interview setup incomplete - check the logs above';
    END IF;
END $$;
