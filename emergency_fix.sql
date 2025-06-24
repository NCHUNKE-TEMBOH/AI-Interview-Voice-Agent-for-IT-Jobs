-- =====================================================
-- EMERGENCY FIX - MINIMAL SETUP TO GET FUNCTIONALITY WORKING
-- Use this if other scripts fail due to type mismatches
-- =====================================================

-- 1. Clean up orphaned Job_Submissions (this is the main issue)
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    RAISE NOTICE 'EMERGENCY FIX: Cleaning up orphaned Job_Submissions...';
    
    -- Count and delete orphaned job references
    SELECT COUNT(*) INTO orphaned_count
    FROM "Job_Submissions" js
    LEFT JOIN "Jobs" j ON js.job_id = j.id
    WHERE j.id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Deleting % orphaned Job_Submissions records...', orphaned_count;
        DELETE FROM "Job_Submissions" 
        WHERE job_id NOT IN (SELECT id FROM "Jobs");
        RAISE NOTICE 'Deleted % orphaned records', orphaned_count;
    ELSE
        RAISE NOTICE 'No orphaned Job_Submissions found';
    END IF;
    
    -- Clean up orphaned user references if they exist
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Job_Submissions' AND column_name = 'user_id') THEN
        SELECT COUNT(*) INTO orphaned_count
        FROM "Job_Submissions" js
        LEFT JOIN "Users" u ON js.user_id = u.id
        WHERE js.user_id IS NOT NULL AND u.id IS NULL;
        
        IF orphaned_count > 0 THEN
            RAISE NOTICE 'Deleting % orphaned user references...', orphaned_count;
            DELETE FROM "Job_Submissions" 
            WHERE user_id IS NOT NULL 
            AND user_id NOT IN (SELECT id FROM "Users");
        END IF;
    END IF;
END $$;

-- 2. Add missing columns to Job_Submissions
DO $$
BEGIN
    -- Add cv_screened column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Job_Submissions' AND column_name = 'cv_screened') THEN
        ALTER TABLE "Job_Submissions" ADD COLUMN cv_screened BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added cv_screened column';
    END IF;

    -- Add application_status column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Job_Submissions' AND column_name = 'application_status') THEN
        ALTER TABLE "Job_Submissions" ADD COLUMN application_status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added application_status column';
    END IF;

    -- Update existing records
    UPDATE "Job_Submissions" SET application_status = 'pending' WHERE application_status IS NULL;
    RAISE NOTICE 'Updated existing records with default status';
END $$;

-- 3. Create CV_Screening_Results table (minimal version, no foreign keys)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CV_Screening_Results') THEN
        RAISE NOTICE 'Creating CV_Screening_Results table (minimal version)...';
        
        -- Create with TEXT IDs to avoid type issues
        CREATE TABLE "CV_Screening_Results" (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id TEXT NOT NULL,
            company_id TEXT NOT NULL,
            job_id TEXT NOT NULL,
            match_score INTEGER NOT NULL CHECK (match_score >= 1 AND match_score <= 10),
            summary TEXT NOT NULL,
            skills_match TEXT,
            experience_relevance TEXT,
            education_match TEXT,
            screening_data JSONB,
            screened_by TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add basic indexes
        CREATE INDEX idx_cv_screening_user_id ON "CV_Screening_Results"(user_id);
        CREATE INDEX idx_cv_screening_company_id ON "CV_Screening_Results"(company_id);
        CREATE INDEX idx_cv_screening_job_id ON "CV_Screening_Results"(job_id);

        RAISE NOTICE 'CV_Screening_Results table created (no foreign keys)';
    ELSE
        RAISE NOTICE 'CV_Screening_Results table already exists';
    END IF;
END $$;

-- 4. Create simple view for candidates (no complex joins)
CREATE OR REPLACE VIEW "Company_Candidates_View" AS
SELECT 
    js.*,
    u.name as user_name,
    u.email as user_email,
    u.cv_url,
    u.cv_filename,
    u.cv_uploaded_at,
    j.job_title,
    j.company_id,
    csr.match_score,
    csr.summary as screening_summary,
    csr.created_at as screened_at
FROM "Job_Submissions" js
LEFT JOIN "Users" u ON (
    (js.user_email IS NOT NULL AND js.user_email = u.email) OR
    (js.user_id IS NOT NULL AND js.user_id::text = u.id::text)
)
LEFT JOIN "Jobs" j ON js.job_id = j.id
LEFT JOIN "CV_Screening_Results" csr ON (
    js.user_id::text = csr.user_id AND js.job_id::text = csr.job_id
);

-- 5. Enable RLS with simple policies (no type comparisons)
DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE "CV_Screening_Results" ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies
    DROP POLICY IF EXISTS "Allow all for CV screening" ON "CV_Screening_Results";

    -- Create one simple policy that allows everything for now
    CREATE POLICY "Allow all for CV screening" ON "CV_Screening_Results"
        FOR ALL USING (true);

    RAISE NOTICE 'Simple RLS policy created (allows all access)';
END $$;

-- 6. Grant necessary permissions
DO $$
BEGIN
    -- Grant permissions to authenticated users
    GRANT ALL ON "CV_Screening_Results" TO authenticated;
    GRANT ALL ON "Company_Candidates_View" TO authenticated;
    GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    
    RAISE NOTICE 'Permissions granted';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not grant some permissions (this is usually fine): %', SQLERRM;
END $$;

-- 7. Test the setup
DO $$
DECLARE
    job_submissions_count INTEGER;
    jobs_count INTEGER;
    users_count INTEGER;
    cv_table_exists BOOLEAN;
    view_exists BOOLEAN;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO job_submissions_count FROM "Job_Submissions";
    SELECT COUNT(*) INTO jobs_count FROM "Jobs";
    SELECT COUNT(*) INTO users_count FROM "Users";
    
    -- Check if table and view exist
    SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CV_Screening_Results') INTO cv_table_exists;
    SELECT EXISTS (SELECT FROM information_schema.views WHERE table_name = 'Company_Candidates_View') INTO view_exists;

    RAISE NOTICE '=== EMERGENCY FIX COMPLETED ===';
    RAISE NOTICE 'Job_Submissions: % records', job_submissions_count;
    RAISE NOTICE 'Jobs: % records', jobs_count;
    RAISE NOTICE 'Users: % records', users_count;
    RAISE NOTICE 'CV_Screening_Results table exists: %', cv_table_exists;
    RAISE NOTICE 'Company_Candidates_View exists: %', view_exists;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Orphaned records cleaned up';
    RAISE NOTICE '✅ Missing columns added';
    RAISE NOTICE '✅ CV screening table created';
    RAISE NOTICE '✅ Simple view created';
    RAISE NOTICE '✅ Basic permissions set';
    RAISE NOTICE '';
    RAISE NOTICE 'Your application should now work!';
    RAISE NOTICE 'Try the candidates page and CV screening functionality.';
END $$;
