-- =====================================================
-- SUPABASE DATABASE SETUP FOR HIREIN AI PLATFORM
-- COMPREHENSIVE FIX FOR ALL DATA TYPE ISSUES
-- =====================================================

-- First, let's check what tables exist and their ID types
DO $$
DECLARE
    users_id_type TEXT;
    companies_id_type TEXT;
    jobs_id_type TEXT;
    submissions_id_type TEXT;
BEGIN
    -- Get the data type of existing tables
    SELECT data_type INTO users_id_type
    FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'id';

    SELECT data_type INTO companies_id_type
    FROM information_schema.columns
    WHERE table_name = 'Companies' AND column_name = 'id';

    SELECT data_type INTO jobs_id_type
    FROM information_schema.columns
    WHERE table_name = 'Jobs' AND column_name = 'id';

    SELECT data_type INTO submissions_id_type
    FROM information_schema.columns
    WHERE table_name = 'Job_Submissions' AND column_name = 'id';

    RAISE NOTICE 'Existing table ID types:';
    RAISE NOTICE 'Users.id: %', COALESCE(users_id_type, 'TABLE_NOT_EXISTS');
    RAISE NOTICE 'Companies.id: %', COALESCE(companies_id_type, 'TABLE_NOT_EXISTS');
    RAISE NOTICE 'Jobs.id: %', COALESCE(jobs_id_type, 'TABLE_NOT_EXISTS');
    RAISE NOTICE 'Job_Submissions.id: %', COALESCE(submissions_id_type, 'TABLE_NOT_EXISTS');
END $$;

-- 1. CREATE OR UPDATE COMPANIES TABLE
-- =====================================================
DO $$
DECLARE
    companies_exists BOOLEAN;
    companies_id_type TEXT;
BEGIN
    -- Check if Companies table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'Companies'
    ) INTO companies_exists;

    IF NOT companies_exists THEN
        -- Create new table with UUID
        CREATE TABLE "Companies" (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            picture TEXT DEFAULT '',
            is_onboarded BOOLEAN DEFAULT false,
            industry_type TEXT DEFAULT 'Technology',
            company_size TEXT DEFAULT '',
            website TEXT DEFAULT '',
            description TEXT DEFAULT '',
            location TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created new Companies table with UUID';
    ELSE
        -- Add missing columns to existing table
        ALTER TABLE "Companies"
        ADD COLUMN IF NOT EXISTS company_size TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Updated existing Companies table';
    END IF;
END $$;

-- 2. CREATE OR UPDATE USERS TABLE
-- =====================================================
DO $$
DECLARE
    users_exists BOOLEAN;
    users_id_type TEXT;
BEGIN
    -- Check if Users table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'Users'
    ) INTO users_exists;

    IF NOT users_exists THEN
        -- Create new table with UUID
        CREATE TABLE "Users" (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            picture TEXT DEFAULT '',
            credits INTEGER DEFAULT 10,
            cv_url TEXT DEFAULT NULL,
            cv_filename TEXT DEFAULT NULL,
            cv_uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            cv_upload_count INTEGER DEFAULT 0,
            job_applications_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created new Users table with UUID';
    ELSE
        -- Add missing columns to existing table
        ALTER TABLE "Users"
        ADD COLUMN IF NOT EXISTS cv_url TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS cv_filename TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS cv_uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS cv_upload_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS job_applications_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Updated existing Users table';
    END IF;
END $$;

-- 3. CREATE CV SCREENING RESULTS TABLE WITH DYNAMIC DATA TYPES
-- =====================================================
DO $$
DECLARE
    users_id_type TEXT;
    companies_id_type TEXT;
    jobs_id_type TEXT;
    screening_exists BOOLEAN;
    create_table_sql TEXT;
BEGIN
    -- Check if CV_Screening_Results table already exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'CV_Screening_Results'
    ) INTO screening_exists;

    IF NOT screening_exists THEN
        -- Get the actual data types of existing tables
        SELECT data_type INTO users_id_type
        FROM information_schema.columns
        WHERE table_name = 'Users' AND column_name = 'id';

        SELECT data_type INTO companies_id_type
        FROM information_schema.columns
        WHERE table_name = 'Companies' AND column_name = 'id';

        SELECT data_type INTO jobs_id_type
        FROM information_schema.columns
        WHERE table_name = 'Jobs' AND column_name = 'id';

        -- Default to UUID if tables don't exist
        users_id_type := COALESCE(users_id_type, 'uuid');
        companies_id_type := COALESCE(companies_id_type, 'uuid');
        jobs_id_type := COALESCE(jobs_id_type, 'uuid');

        RAISE NOTICE 'Creating CV_Screening_Results with data types: user_id=%, company_id=%, job_id=%',
                     users_id_type, companies_id_type, jobs_id_type;

        -- Create table with appropriate data types
        IF users_id_type = 'bigint' THEN
            create_table_sql := 'CREATE TABLE "CV_Screening_Results" (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id BIGINT,
                company_id ' || companies_id_type || ',
                job_id ' || jobs_id_type || ',
                match_score DECIMAL(3,1) DEFAULT 0.0,
                summary TEXT DEFAULT '''',
                skills_match TEXT DEFAULT '''',
                experience_relevance TEXT DEFAULT '''',
                education_match TEXT DEFAULT '''',
                screening_data JSONB DEFAULT ''{}''::jsonb,
                screened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                screened_by ' || companies_id_type || '
            )';
        ELSE
            create_table_sql := 'CREATE TABLE "CV_Screening_Results" (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID,
                company_id UUID,
                job_id UUID,
                match_score DECIMAL(3,1) DEFAULT 0.0,
                summary TEXT DEFAULT '''',
                skills_match TEXT DEFAULT '''',
                experience_relevance TEXT DEFAULT '''',
                education_match TEXT DEFAULT '''',
                screening_data JSONB DEFAULT ''{}''::jsonb,
                screened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                screened_by UUID
            )';
        END IF;

        EXECUTE create_table_sql;
        RAISE NOTICE 'Created CV_Screening_Results table';
    ELSE
        RAISE NOTICE 'CV_Screening_Results table already exists';
    END IF;
END $$;

-- Add foreign key constraints safely
DO $$
DECLARE
    users_id_type TEXT;
    companies_id_type TEXT;
    jobs_id_type TEXT;
BEGIN
    -- Get the actual data types
    SELECT data_type INTO users_id_type
    FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'id';

    SELECT data_type INTO companies_id_type
    FROM information_schema.columns
    WHERE table_name = 'Companies' AND column_name = 'id';

    SELECT data_type INTO jobs_id_type
    FROM information_schema.columns
    WHERE table_name = 'Jobs' AND column_name = 'id';

    -- Only add foreign keys if tables exist and data types match
    IF users_id_type IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'cv_screening_user_fkey'
    ) THEN
        ALTER TABLE "CV_Screening_Results"
        ADD CONSTRAINT cv_screening_user_fkey
        FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id foreign key';
    END IF;

    IF companies_id_type IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'cv_screening_company_fkey'
    ) THEN
        ALTER TABLE "CV_Screening_Results"
        ADD CONSTRAINT cv_screening_company_fkey
        FOREIGN KEY (company_id) REFERENCES "Companies"(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added company_id foreign key';
    END IF;

    IF jobs_id_type IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'cv_screening_job_fkey'
    ) THEN
        ALTER TABLE "CV_Screening_Results"
        ADD CONSTRAINT cv_screening_job_fkey
        FOREIGN KEY (job_id) REFERENCES "Jobs"(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added job_id foreign key';
    END IF;

    IF companies_id_type IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'cv_screening_screened_by_fkey'
    ) THEN
        ALTER TABLE "CV_Screening_Results"
        ADD CONSTRAINT cv_screening_screened_by_fkey
        FOREIGN KEY (screened_by) REFERENCES "Companies"(id);
        RAISE NOTICE 'Added screened_by foreign key';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding foreign keys: %', SQLERRM;
END $$;

-- 4. UPDATE JOBS TABLE (if needed)
-- =====================================================
ALTER TABLE "Jobs" 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. UPDATE JOB_SUBMISSIONS TABLE WITH DYNAMIC DATA TYPES
-- =====================================================
DO $$
DECLARE
    submissions_exists BOOLEAN;
    users_id_type TEXT;
BEGIN
    -- Check if Job_Submissions table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'Job_Submissions'
    ) INTO submissions_exists;

    IF submissions_exists THEN
        -- Get Users table ID type for compatibility
        SELECT data_type INTO users_id_type
        FROM information_schema.columns
        WHERE table_name = 'Users' AND column_name = 'id';

        -- Add missing columns with appropriate data types
        IF users_id_type = 'bigint' THEN
            -- Add columns for BIGINT compatibility
            ALTER TABLE "Job_Submissions"
            ADD COLUMN IF NOT EXISTS cv_screened BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS screening_result_id UUID,
            ADD COLUMN IF NOT EXISTS user_id BIGINT,
            ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS interview_completed BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ELSE
            -- Add columns for UUID compatibility
            ALTER TABLE "Job_Submissions"
            ADD COLUMN IF NOT EXISTS cv_screened BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS screening_result_id UUID,
            ADD COLUMN IF NOT EXISTS user_id UUID,
            ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS interview_completed BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;

        RAISE NOTICE 'Updated Job_Submissions table with user_id type: %', users_id_type;
    ELSE
        RAISE NOTICE 'Job_Submissions table does not exist - will be created by application';
    END IF;
END $$;

-- Add foreign key constraints for Job_Submissions safely
DO $$
DECLARE
    users_id_type TEXT;
    submissions_exists BOOLEAN;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'Job_Submissions'
    ) INTO submissions_exists;

    IF submissions_exists THEN
        -- Get Users table ID type
        SELECT data_type INTO users_id_type
        FROM information_schema.columns
        WHERE table_name = 'Users' AND column_name = 'id';

        -- Add screening_result_id foreign key
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'job_submissions_screening_result_fkey'
        ) THEN
            ALTER TABLE "Job_Submissions"
            ADD CONSTRAINT job_submissions_screening_result_fkey
            FOREIGN KEY (screening_result_id) REFERENCES "CV_Screening_Results"(id);
            RAISE NOTICE 'Added screening_result_id foreign key';
        END IF;

        -- Add user_id foreign key only if Users table exists
        IF users_id_type IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'job_submissions_user_fkey'
        ) THEN
            ALTER TABLE "Job_Submissions"
            ADD CONSTRAINT job_submissions_user_fkey
            FOREIGN KEY (user_id) REFERENCES "Users"(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added user_id foreign key';
        END IF;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding Job_Submissions foreign keys: %', SQLERRM;
END $$;

-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_companies_email ON "Companies"(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"(email);
CREATE INDEX IF NOT EXISTS idx_users_cv_url ON "Users"(cv_url);
CREATE INDEX IF NOT EXISTS idx_cv_screening_user_id ON "CV_Screening_Results"(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_screening_company_id ON "CV_Screening_Results"(company_id);
CREATE INDEX IF NOT EXISTS idx_cv_screening_job_id ON "CV_Screening_Results"(job_id);

-- 7. CREATE STORAGE BUCKET POLICIES (Run these separately in Supabase Dashboard)
-- =====================================================
-- Note: These need to be run in the Supabase Dashboard Storage section
-- or through the Supabase CLI, not in SQL Editor

-- 8. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "Companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CV_Screening_Results" ENABLE ROW LEVEL SECURITY;

-- Companies can only see their own data
CREATE POLICY "Companies can view own data" ON "Companies"
    FOR ALL USING (auth.jwt() ->> 'email' = email);

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON "Users"
    FOR ALL USING (auth.jwt() ->> 'email' = email);

-- Companies can view CV screening results for their jobs
CREATE POLICY "Companies can view screening results" ON "CV_Screening_Results"
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM "Companies" 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Companies can insert screening results for their jobs
CREATE POLICY "Companies can create screening results" ON "CV_Screening_Results"
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM "Companies" 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- 9. CREATE FUNCTIONS FOR AUTOMATIC TIMESTAMPS AND BILLING
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create billing functions that work with both UUID and BIGINT
DO $$
DECLARE
    users_id_type TEXT;
BEGIN
    -- Get Users table ID type
    SELECT data_type INTO users_id_type
    FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'id';

    -- Create functions based on the actual ID type
    IF users_id_type = 'bigint' THEN
        -- Functions for BIGINT IDs
        EXECUTE '
        CREATE OR REPLACE FUNCTION can_apply_for_job(user_id BIGINT)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
        BEGIN
            SELECT credits INTO user_credits FROM "Users" WHERE id = user_id;
            RETURN user_credits > 0;
        END;
        $func$ language ''plpgsql'';

        CREATE OR REPLACE FUNCTION can_upload_cv(user_id BIGINT)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
            upload_count INTEGER;
        BEGIN
            SELECT credits, cv_upload_count INTO user_credits, upload_count
            FROM "Users" WHERE id = user_id;

            RETURN user_credits > 0 AND (upload_count < 3 OR upload_count IS NULL);
        END;
        $func$ language ''plpgsql'';

        CREATE OR REPLACE FUNCTION deduct_credits_for_application(user_id BIGINT, job_id UUID)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
            application_exists BOOLEAN;
        BEGIN
            SELECT EXISTS(
                SELECT 1 FROM "Job_Submissions"
                WHERE user_id = deduct_credits_for_application.user_id
                AND job_id = deduct_credits_for_application.job_id
            ) INTO application_exists;

            IF application_exists THEN
                RETURN FALSE;
            END IF;

            SELECT credits INTO user_credits FROM "Users" WHERE id = user_id;

            IF user_credits > 0 THEN
                UPDATE "Users"
                SET credits = credits - 1,
                    job_applications_count = job_applications_count + 1,
                    updated_at = NOW()
                WHERE id = user_id;
                RETURN TRUE;
            ELSE
                RETURN FALSE;
            END IF;
        END;
        $func$ language ''plpgsql'';

        CREATE OR REPLACE FUNCTION deduct_credits_for_cv_upload(user_id BIGINT)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
            upload_count INTEGER;
        BEGIN
            SELECT credits, cv_upload_count INTO user_credits, upload_count
            FROM "Users" WHERE id = user_id;

            IF user_credits > 0 AND (upload_count < 3 OR upload_count IS NULL) THEN
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
        $func$ language ''plpgsql'';
        ';
    ELSE
        -- Functions for UUID IDs
        EXECUTE '
        CREATE OR REPLACE FUNCTION can_apply_for_job(user_id UUID)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
        BEGIN
            SELECT credits INTO user_credits FROM "Users" WHERE id = user_id;
            RETURN user_credits > 0;
        END;
        $func$ language ''plpgsql'';

        CREATE OR REPLACE FUNCTION can_upload_cv(user_id UUID)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
            upload_count INTEGER;
        BEGIN
            SELECT credits, cv_upload_count INTO user_credits, upload_count
            FROM "Users" WHERE id = user_id;

            RETURN user_credits > 0 AND (upload_count < 3 OR upload_count IS NULL);
        END;
        $func$ language ''plpgsql'';

        CREATE OR REPLACE FUNCTION deduct_credits_for_application(user_id UUID, job_id UUID)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
            application_exists BOOLEAN;
        BEGIN
            SELECT EXISTS(
                SELECT 1 FROM "Job_Submissions"
                WHERE user_id = deduct_credits_for_application.user_id
                AND job_id = deduct_credits_for_application.job_id
            ) INTO application_exists;

            IF application_exists THEN
                RETURN FALSE;
            END IF;

            SELECT credits INTO user_credits FROM "Users" WHERE id = user_id;

            IF user_credits > 0 THEN
                UPDATE "Users"
                SET credits = credits - 1,
                    job_applications_count = job_applications_count + 1,
                    updated_at = NOW()
                WHERE id = user_id;
                RETURN TRUE;
            ELSE
                RETURN FALSE;
            END IF;
        END;
        $func$ language ''plpgsql'';

        CREATE OR REPLACE FUNCTION deduct_credits_for_cv_upload(user_id UUID)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
            upload_count INTEGER;
        BEGIN
            SELECT credits, cv_upload_count INTO user_credits, upload_count
            FROM "Users" WHERE id = user_id;

            IF user_credits > 0 AND (upload_count < 3 OR upload_count IS NULL) THEN
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
        $func$ language ''plpgsql'';
        ';
    END IF;

    RAISE NOTICE 'Created billing functions for % ID type', users_id_type;
END $$;

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON "Companies"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "Users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON "Jobs"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_submissions_updated_at BEFORE UPDATE ON "Job_Submissions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. SAMPLE DATA VERIFICATION QUERIES
-- =====================================================
-- Run these to check your data after setup

-- Check Companies table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Companies' 
ORDER BY ordinal_position;

-- Check Users table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Users' 
ORDER BY ordinal_position;

-- Check if you have any companies
SELECT id, email, name, is_onboarded FROM "Companies" LIMIT 5;

-- Check if you have any users
SELECT id, email, name, cv_url FROM "Users" LIMIT 5;
