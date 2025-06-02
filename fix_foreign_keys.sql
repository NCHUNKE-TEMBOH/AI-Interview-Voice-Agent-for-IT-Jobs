-- =====================================================
-- FIX FOREIGN KEY RELATIONSHIPS
-- This script adds missing foreign key constraints
-- =====================================================

-- 1. Check current table structures
DO $$
DECLARE
    jobs_id_type TEXT;
    companies_id_type TEXT;
    users_id_type TEXT;
    submissions_exists BOOLEAN;
BEGIN
    -- Get ID types
    SELECT data_type INTO jobs_id_type
    FROM information_schema.columns
    WHERE table_name = 'Jobs' AND column_name = 'id';
    
    SELECT data_type INTO companies_id_type
    FROM information_schema.columns
    WHERE table_name = 'Companies' AND column_name = 'id';
    
    SELECT data_type INTO users_id_type
    FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'id';
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Job_Submissions'
    ) INTO submissions_exists;
    
    RAISE NOTICE 'Table ID types: Jobs=%, Companies=%, Users=%', 
                 COALESCE(jobs_id_type, 'NOT_EXISTS'), 
                 COALESCE(companies_id_type, 'NOT_EXISTS'), 
                 COALESCE(users_id_type, 'NOT_EXISTS');
    RAISE NOTICE 'Job_Submissions exists: %', submissions_exists;
END $$;

-- 2. Add missing foreign key from Jobs to Companies (if needed)
DO $$
DECLARE
    jobs_exists BOOLEAN;
    companies_exists BOOLEAN;
    fk_exists BOOLEAN;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Jobs') INTO jobs_exists;
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Companies') INTO companies_exists;
    
    -- Check if foreign key already exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'jobs_company_id_fkey' 
        AND table_name = 'Jobs'
    ) INTO fk_exists;
    
    IF jobs_exists AND companies_exists AND NOT fk_exists THEN
        -- Add foreign key constraint
        ALTER TABLE "Jobs" 
        ADD CONSTRAINT jobs_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES "Companies"(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key: Jobs.company_id -> Companies.id';
    ELSE
        RAISE NOTICE 'Skipped Jobs->Companies FK: jobs_exists=%, companies_exists=%, fk_exists=%', 
                     jobs_exists, companies_exists, fk_exists;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding Jobs->Companies FK: %', SQLERRM;
END $$;

-- 3. Add missing foreign key from Job_Submissions to Jobs (if needed)
DO $$
DECLARE
    submissions_exists BOOLEAN;
    jobs_exists BOOLEAN;
    fk_exists BOOLEAN;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Job_Submissions') INTO submissions_exists;
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Jobs') INTO jobs_exists;
    
    -- Check if foreign key already exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_submissions_job_id_fkey' 
        AND table_name = 'Job_Submissions'
    ) INTO fk_exists;
    
    IF submissions_exists AND jobs_exists AND NOT fk_exists THEN
        -- Add foreign key constraint
        ALTER TABLE "Job_Submissions" 
        ADD CONSTRAINT job_submissions_job_id_fkey 
        FOREIGN KEY (job_id) REFERENCES "Jobs"(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key: Job_Submissions.job_id -> Jobs.id';
    ELSE
        RAISE NOTICE 'Skipped Job_Submissions->Jobs FK: submissions_exists=%, jobs_exists=%, fk_exists=%', 
                     submissions_exists, jobs_exists, fk_exists;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding Job_Submissions->Jobs FK: %', SQLERRM;
END $$;

-- 4. Add missing foreign key from Job_Submissions to Users (if needed)
DO $$
DECLARE
    submissions_exists BOOLEAN;
    users_exists BOOLEAN;
    user_id_column_exists BOOLEAN;
    fk_exists BOOLEAN;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Job_Submissions') INTO submissions_exists;
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Users') INTO users_exists;
    
    -- Check if user_id column exists in Job_Submissions
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'Job_Submissions' AND column_name = 'user_id'
    ) INTO user_id_column_exists;
    
    -- Check if foreign key already exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_submissions_user_id_fkey' 
        AND table_name = 'Job_Submissions'
    ) INTO fk_exists;
    
    IF submissions_exists AND users_exists AND user_id_column_exists AND NOT fk_exists THEN
        -- Add foreign key constraint
        ALTER TABLE "Job_Submissions" 
        ADD CONSTRAINT job_submissions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key: Job_Submissions.user_id -> Users.id';
    ELSE
        RAISE NOTICE 'Skipped Job_Submissions->Users FK: submissions_exists=%, users_exists=%, user_id_column_exists=%, fk_exists=%', 
                     submissions_exists, users_exists, user_id_column_exists, fk_exists;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding Job_Submissions->Users FK: %', SQLERRM;
END $$;

-- 5. Clean up duplicate companies (if any)
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check for duplicate companies by email
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT email, COUNT(*) as cnt
        FROM "Companies"
        GROUP BY email
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate company emails', duplicate_count;
        
        -- Keep only the first company for each email (by created_at or id)
        DELETE FROM "Companies" 
        WHERE id NOT IN (
            SELECT DISTINCT ON (email) id
            FROM "Companies"
            ORDER BY email, created_at ASC
        );
        
        RAISE NOTICE 'Cleaned up duplicate companies';
    ELSE
        RAISE NOTICE 'No duplicate companies found';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning up duplicates: %', SQLERRM;
END $$;

-- 6. Add unique constraint on company email (if not exists)
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    -- Check if unique constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'companies_email_key' 
        AND table_name = 'Companies'
        AND constraint_type = 'UNIQUE'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        ALTER TABLE "Companies" ADD CONSTRAINT companies_email_key UNIQUE (email);
        RAISE NOTICE 'Added unique constraint on Companies.email';
    ELSE
        RAISE NOTICE 'Unique constraint on Companies.email already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding unique constraint: %', SQLERRM;
END $$;

-- 7. Final verification
DO $$
DECLARE
    jobs_companies_fk BOOLEAN;
    submissions_jobs_fk BOOLEAN;
    submissions_users_fk BOOLEAN;
BEGIN
    -- Check if foreign keys exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'Jobs'
        AND constraint_name LIKE '%company%'
    ) INTO jobs_companies_fk;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'Job_Submissions'
        AND constraint_name LIKE '%job%'
    ) INTO submissions_jobs_fk;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'Job_Submissions'
        AND constraint_name LIKE '%user%'
    ) INTO submissions_users_fk;
    
    RAISE NOTICE 'Foreign key status:';
    RAISE NOTICE '  Jobs -> Companies: %', jobs_companies_fk;
    RAISE NOTICE '  Job_Submissions -> Jobs: %', submissions_jobs_fk;
    RAISE NOTICE '  Job_Submissions -> Users: %', submissions_users_fk;
END $$;

DO $$
BEGIN
    RAISE NOTICE 'Foreign key repair completed!';
    RAISE NOTICE 'If you still see relationship errors, try refreshing your Supabase schema cache.';
END $$;
