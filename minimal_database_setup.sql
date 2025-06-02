-- =====================================================
-- MINIMAL DATABASE SETUP - SAFE VERSION
-- This script only adds missing columns and functions
-- without creating new tables or foreign keys
-- =====================================================

-- 1. Add missing columns to Users table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Users') THEN
        -- Add CV-related columns
        ALTER TABLE "Users" 
        ADD COLUMN IF NOT EXISTS cv_url TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS cv_filename TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS cv_uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS cv_upload_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS job_applications_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added missing columns to Users table';
    ELSE
        RAISE NOTICE 'Users table does not exist - skipping';
    END IF;
END $$;

-- 2. Add missing columns to Companies table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Companies') THEN
        ALTER TABLE "Companies" 
        ADD COLUMN IF NOT EXISTS company_size TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added missing columns to Companies table';
    ELSE
        RAISE NOTICE 'Companies table does not exist - skipping';
    END IF;
END $$;

-- 3. Add missing columns to Job_Submissions table (if it exists)
DO $$
DECLARE
    users_id_type TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Job_Submissions') THEN
        -- Get Users table ID type for compatibility
        SELECT data_type INTO users_id_type
        FROM information_schema.columns
        WHERE table_name = 'Users' AND column_name = 'id';
        
        -- Add basic columns first
        ALTER TABLE "Job_Submissions" 
        ADD COLUMN IF NOT EXISTS cv_screened BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS interview_completed BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Add user_id column with appropriate type
        IF users_id_type = 'bigint' THEN
            ALTER TABLE "Job_Submissions" ADD COLUMN IF NOT EXISTS user_id BIGINT;
        ELSE
            ALTER TABLE "Job_Submissions" ADD COLUMN IF NOT EXISTS user_id UUID;
        END IF;
        
        RAISE NOTICE 'Added missing columns to Job_Submissions table with user_id type: %', users_id_type;
    ELSE
        RAISE NOTICE 'Job_Submissions table does not exist - skipping';
    END IF;
END $$;

-- 4. Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Create billing functions based on actual table structure
DO $$
DECLARE
    users_id_type TEXT;
    users_exists BOOLEAN;
BEGIN
    -- Check if Users table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Users'
    ) INTO users_exists;
    
    IF users_exists THEN
        -- Get Users table ID type
        SELECT data_type INTO users_id_type
        FROM information_schema.columns
        WHERE table_name = 'Users' AND column_name = 'id';
        
        -- Create functions based on the actual ID type
        IF users_id_type = 'bigint' THEN
            -- Functions for BIGINT IDs
            CREATE OR REPLACE FUNCTION can_apply_for_job(user_id BIGINT)
            RETURNS BOOLEAN AS $func$
            DECLARE
                user_credits INTEGER;
            BEGIN
                SELECT credits INTO user_credits FROM "Users" WHERE id = user_id;
                RETURN COALESCE(user_credits, 0) > 0;
            END;
            $func$ language 'plpgsql';
            
            CREATE OR REPLACE FUNCTION can_upload_cv(user_id BIGINT)
            RETURNS BOOLEAN AS $func$
            DECLARE
                user_credits INTEGER;
                upload_count INTEGER;
            BEGIN
                SELECT credits, cv_upload_count INTO user_credits, upload_count 
                FROM "Users" WHERE id = user_id;
                
                RETURN COALESCE(user_credits, 0) > 0 AND COALESCE(upload_count, 0) < 3;
            END;
            $func$ language 'plpgsql';
            
            CREATE OR REPLACE FUNCTION deduct_credits_for_cv_upload(user_id BIGINT)
            RETURNS BOOLEAN AS $func$
            DECLARE
                user_credits INTEGER;
                upload_count INTEGER;
            BEGIN
                SELECT credits, cv_upload_count INTO user_credits, upload_count 
                FROM "Users" WHERE id = user_id;
                
                IF COALESCE(user_credits, 0) > 0 AND COALESCE(upload_count, 0) < 3 THEN
                    UPDATE "Users" 
                    SET credits = credits - 1,
                        cv_upload_count = COALESCE(cv_upload_count, 0) + 1,
                        updated_at = NOW()
                    WHERE id = user_id;
                    RETURN TRUE;
                ELSE
                    RETURN FALSE;
                END IF;
            END;
            $func$ language 'plpgsql';
            
        ELSE
            -- Functions for UUID IDs
            CREATE OR REPLACE FUNCTION can_apply_for_job(user_id UUID)
            RETURNS BOOLEAN AS $func$
            DECLARE
                user_credits INTEGER;
            BEGIN
                SELECT credits INTO user_credits FROM "Users" WHERE id = user_id;
                RETURN COALESCE(user_credits, 0) > 0;
            END;
            $func$ language 'plpgsql';
            
            CREATE OR REPLACE FUNCTION can_upload_cv(user_id UUID)
            RETURNS BOOLEAN AS $func$
            DECLARE
                user_credits INTEGER;
                upload_count INTEGER;
            BEGIN
                SELECT credits, cv_upload_count INTO user_credits, upload_count 
                FROM "Users" WHERE id = user_id;
                
                RETURN COALESCE(user_credits, 0) > 0 AND COALESCE(upload_count, 0) < 3;
            END;
            $func$ language 'plpgsql';
            
            CREATE OR REPLACE FUNCTION deduct_credits_for_cv_upload(user_id UUID)
            RETURNS BOOLEAN AS $func$
            DECLARE
                user_credits INTEGER;
                upload_count INTEGER;
            BEGIN
                SELECT credits, cv_upload_count INTO user_credits, upload_count 
                FROM "Users" WHERE id = user_id;
                
                IF COALESCE(user_credits, 0) > 0 AND COALESCE(upload_count, 0) < 3 THEN
                    UPDATE "Users" 
                    SET credits = credits - 1,
                        cv_upload_count = COALESCE(cv_upload_count, 0) + 1,
                        updated_at = NOW()
                    WHERE id = user_id;
                    RETURN TRUE;
                ELSE
                    RETURN FALSE;
                END IF;
            END;
            $func$ language 'plpgsql';
        END IF;
        
        RAISE NOTICE 'Created billing functions for % ID type', users_id_type;
    ELSE
        RAISE NOTICE 'Users table does not exist - skipping function creation';
    END IF;
END $$;

-- 6. Add update triggers (if tables exist)
DO $$
BEGIN
    -- Add trigger to Users table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Users') THEN
        DROP TRIGGER IF EXISTS update_users_updated_at ON "Users";
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON "Users"
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Add trigger to Companies table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Companies') THEN
        DROP TRIGGER IF EXISTS update_companies_updated_at ON "Companies";
        CREATE TRIGGER update_companies_updated_at
            BEFORE UPDATE ON "Companies"
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Add trigger to Job_Submissions table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Job_Submissions') THEN
        DROP TRIGGER IF EXISTS update_job_submissions_updated_at ON "Job_Submissions";
        CREATE TRIGGER update_job_submissions_updated_at
            BEFORE UPDATE ON "Job_Submissions"
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    RAISE NOTICE 'Added update triggers to existing tables';
END $$;

-- 7. Enable RLS on storage (if accessible)
DO $$
BEGIN
    -- Try to enable RLS on storage.objects
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on storage.objects';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not enable RLS on storage.objects: %', SQLERRM;
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Minimal database setup completed successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run verify_database.sql to check your setup';
    RAISE NOTICE '2. Create the cv-uploads storage bucket manually in Supabase dashboard';
    RAISE NOTICE '3. Set up storage policies using STORAGE_SETUP_INSTRUCTIONS.md';
END $$;
