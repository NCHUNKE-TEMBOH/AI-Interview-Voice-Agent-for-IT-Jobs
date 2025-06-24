-- =====================================================
-- FIX CV SCREENING TABLE AND COMPANY ERRORS
-- Run this in Supabase SQL Editor to fix all database issues
-- =====================================================

-- 1. Create CV_Screening_Results table if it doesn't exist
DO $$ 
BEGIN
    -- Check if CV_Screening_Results table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CV_Screening_Results') THEN
        
        RAISE NOTICE 'Creating CV_Screening_Results table...';
        
        CREATE TABLE "CV_Screening_Results" (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            company_id UUID NOT NULL,
            job_id UUID NOT NULL,
            match_score INTEGER NOT NULL CHECK (match_score >= 1 AND match_score <= 10),
            summary TEXT NOT NULL,
            skills_match TEXT,
            experience_relevance TEXT,
            education_match TEXT,
            screening_data JSONB,
            screened_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add indexes for better performance
        CREATE INDEX idx_cv_screening_user_id ON "CV_Screening_Results"(user_id);
        CREATE INDEX idx_cv_screening_company_id ON "CV_Screening_Results"(company_id);
        CREATE INDEX idx_cv_screening_job_id ON "CV_Screening_Results"(job_id);
        CREATE INDEX idx_cv_screening_created_at ON "CV_Screening_Results"(created_at);

        -- Add foreign key constraints (if tables exist)
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Users') THEN
            ALTER TABLE "CV_Screening_Results" 
            ADD CONSTRAINT fk_cv_screening_user 
            FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE CASCADE;
        END IF;

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Companies') THEN
            ALTER TABLE "CV_Screening_Results" 
            ADD CONSTRAINT fk_cv_screening_company 
            FOREIGN KEY (company_id) REFERENCES "Companies"(id) ON DELETE CASCADE;
        END IF;

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Jobs') THEN
            ALTER TABLE "CV_Screening_Results" 
            ADD CONSTRAINT fk_cv_screening_job 
            FOREIGN KEY (job_id) REFERENCES "Jobs"(id) ON DELETE CASCADE;
        END IF;

        RAISE NOTICE 'CV_Screening_Results table created successfully';
    ELSE
        RAISE NOTICE 'CV_Screening_Results table already exists';
    END IF;
END $$;

-- 2. Fix Job_Submissions foreign key relationships
DO $$
DECLARE
    jobs_id_type TEXT;
    users_id_type TEXT;
    companies_id_type TEXT;
BEGIN
    -- Get the actual ID column types
    SELECT data_type INTO jobs_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'Jobs' AND column_name = 'id';
    
    SELECT data_type INTO users_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'Users' AND column_name = 'id';
    
    SELECT data_type INTO companies_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'Companies' AND column_name = 'id';

    RAISE NOTICE 'Jobs ID type: %, Users ID type: %, Companies ID type: %', jobs_id_type, users_id_type, companies_id_type;

    -- Drop existing foreign key constraints if they exist
    BEGIN
        ALTER TABLE "Job_Submissions" DROP CONSTRAINT IF EXISTS "Job_Submissions_job_id_fkey";
        ALTER TABLE "Job_Submissions" DROP CONSTRAINT IF EXISTS "job_submissions_job_id_fkey";
        ALTER TABLE "Job_Submissions" DROP CONSTRAINT IF EXISTS "Job_Submissions_user_id_fkey";
        ALTER TABLE "Job_Submissions" DROP CONSTRAINT IF EXISTS "job_submissions_user_id_fkey";
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Some constraints may not have existed: %', SQLERRM;
    END;

    -- Create proper foreign key constraints with correct naming
    IF jobs_id_type IS NOT NULL THEN
        ALTER TABLE "Job_Submissions" 
        ADD CONSTRAINT "Job_Submissions_job_id_fkey" 
        FOREIGN KEY (job_id) REFERENCES "Jobs"(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Created Job_Submissions_job_id_fkey constraint';
    END IF;

    IF users_id_type IS NOT NULL THEN
        -- Check if user_id column exists in Job_Submissions
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Job_Submissions' AND column_name = 'user_id') THEN
            ALTER TABLE "Job_Submissions" 
            ADD CONSTRAINT "Job_Submissions_user_id_fkey" 
            FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Created Job_Submissions_user_id_fkey constraint';
        END IF;
    END IF;

END $$;

-- 3. Add missing columns to Job_Submissions if they don't exist
DO $$
BEGIN
    -- Add cv_screened column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Job_Submissions' AND column_name = 'cv_screened') THEN
        ALTER TABLE "Job_Submissions" ADD COLUMN cv_screened BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added cv_screened column to Job_Submissions';
    END IF;

    -- Add application_status column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Job_Submissions' AND column_name = 'application_status') THEN
        ALTER TABLE "Job_Submissions" ADD COLUMN application_status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added application_status column to Job_Submissions';
    END IF;

    -- Add screening_result_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Job_Submissions' AND column_name = 'screening_result_id') THEN
        ALTER TABLE "Job_Submissions" ADD COLUMN screening_result_id UUID;
        RAISE NOTICE 'Added screening_result_id column to Job_Submissions';
    END IF;
END $$;

-- 4. Create RLS policies for CV_Screening_Results
DO $$
BEGIN
    -- Enable RLS on CV_Screening_Results
    ALTER TABLE "CV_Screening_Results" ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Companies can view their screening results" ON "CV_Screening_Results";
    DROP POLICY IF EXISTS "Companies can insert screening results" ON "CV_Screening_Results";
    DROP POLICY IF EXISTS "Companies can update their screening results" ON "CV_Screening_Results";
    DROP POLICY IF EXISTS "Users can view their screening results" ON "CV_Screening_Results";

    -- Create policies for companies
    CREATE POLICY "Companies can view their screening results" ON "CV_Screening_Results"
        FOR SELECT USING (company_id = auth.uid() OR screened_by = auth.uid());

    CREATE POLICY "Companies can insert screening results" ON "CV_Screening_Results"
        FOR INSERT WITH CHECK (company_id = auth.uid() OR screened_by = auth.uid());

    CREATE POLICY "Companies can update their screening results" ON "CV_Screening_Results"
        FOR UPDATE USING (company_id = auth.uid() OR screened_by = auth.uid());

    -- Create policy for users to view their own screening results
    CREATE POLICY "Users can view their screening results" ON "CV_Screening_Results"
        FOR SELECT USING (user_id = auth.uid());

    RAISE NOTICE 'RLS policies created for CV_Screening_Results';
END $$;

-- 5. Update existing data
DO $$
BEGIN
    -- Update any existing Job_Submissions without application_status
    UPDATE "Job_Submissions" 
    SET application_status = 'pending' 
    WHERE application_status IS NULL;

    RAISE NOTICE 'Updated existing Job_Submissions with default application_status';
END $$;

-- 6. Create helpful views
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
LEFT JOIN "Users" u ON js.user_id = u.id OR js.user_email = u.email
LEFT JOIN "Jobs" j ON js.job_id = j.id
LEFT JOIN "CV_Screening_Results" csr ON js.user_id = csr.user_id AND js.job_id = csr.job_id;

RAISE NOTICE 'Database fixes completed successfully!';
RAISE NOTICE 'You can now:';
RAISE NOTICE '1. Use CV screening functionality';
RAISE NOTICE '2. View candidates without foreign key errors';
RAISE NOTICE '3. Company profile forms will work properly';
RAISE NOTICE '4. Use the Company_Candidates_View for easier queries';
