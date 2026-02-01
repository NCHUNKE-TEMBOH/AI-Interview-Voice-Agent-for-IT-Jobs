-- =====================================================
-- COMPLETE DATABASE SETUP FOR AI INTERVIEW VOICE AGENT
-- Copy and paste this entire script into Supabase SQL Editor
-- This creates all necessary tables, RLS policies, and functions
-- =====================================================

-- 1. CREATE COMPANIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "Companies" (
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
    address TEXT DEFAULT '',
    company_email TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "Users" (
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

-- 3. CREATE JOBS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "Jobs" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES "Companies"(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    employment_type TEXT,
    location_type TEXT,
    salary_range TEXT,
    application_deadline DATE,
    job_start_date DATE,
    job_description TEXT,
    experience_level TEXT,
    required_skills TEXT,
    ai_criteria TEXT,
    question_count INTEGER DEFAULT 10,
    interview_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE JOB_SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "Job_Submissions" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES "Jobs"(id) ON DELETE CASCADE,
    user_id UUID REFERENCES "Users"(id) ON DELETE CASCADE,
    user_name TEXT,
    user_email TEXT,
    feedback JSONB,
    score INTEGER,
    status TEXT DEFAULT 'pending',
    cv_screened BOOLEAN DEFAULT false,
    screening_result_id UUID,
    application_status TEXT DEFAULT 'pending',
    interview_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE CV_SCREENING_RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "CV_Screening_Results" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES "Users"(id) ON DELETE CASCADE,
    company_id UUID REFERENCES "Companies"(id) ON DELETE CASCADE,
    job_id UUID REFERENCES "Jobs"(id) ON DELETE CASCADE,
    match_score DECIMAL(3,1) DEFAULT 0.0,
    summary TEXT DEFAULT '',
    skills_match TEXT DEFAULT '',
    experience_relevance TEXT DEFAULT '',
    education_match TEXT DEFAULT '',
    screening_data JSONB DEFAULT '{}'::jsonb,
    screened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    screened_by UUID REFERENCES "Companies"(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CREATE INTERVIEWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "Interviews" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id TEXT UNIQUE,
    useremail TEXT NOT NULL,
    username TEXT,
    jobposition TEXT,
    jobdescription TEXT,
    type TEXT,
    duration INTEGER,
    experiencelevel TEXT,
    requiredskills TEXT,
    companycriteria TEXT,
    questionlist JSONB,
    companyid UUID REFERENCES "Companies"(id),
    jobid UUID REFERENCES "Jobs"(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CREATE INTERVIEW-FEEDBACK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "interview-feedback" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id TEXT REFERENCES "Interviews"(interview_id),
    useremail TEXT NOT NULL,
    username TEXT,
    feedback JSONB,
    recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE "Companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job_Submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CV_Screening_Results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Interviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "interview-feedback" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Companies Policies
CREATE POLICY "Companies can view own data" ON "Companies"
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Companies can update own data" ON "Companies"
    FOR UPDATE USING (auth.jwt() ->> 'email' = email)
    WITH CHECK (auth.jwt() ->> 'email' = email);

CREATE POLICY "Companies can insert own data" ON "Companies"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users Policies
CREATE POLICY "Users can view own data" ON "Users"
    FOR ALL USING (auth.jwt() ->> 'email' = email);

-- Jobs Policies
CREATE POLICY "Jobs are viewable by everyone" ON "Jobs"
    FOR SELECT USING (true);

CREATE POLICY "Jobs can be inserted by authenticated users" ON "Jobs"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Jobs can be updated by the company owner" ON "Jobs"
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM "Companies"
        WHERE "Companies".id = "Jobs".company_id
        AND "Companies".email = auth.jwt() ->> 'email'
    ));

CREATE POLICY "Jobs can be deleted by the company owner" ON "Jobs"
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM "Companies"
        WHERE "Companies".id = "Jobs".company_id
        AND "Companies".email = auth.jwt() ->> 'email'
    ));

-- Job_Submissions Policies
CREATE POLICY "Job_Submissions are viewable by everyone" ON "Job_Submissions"
    FOR SELECT USING (true);

CREATE POLICY "Job_Submissions can be inserted by authenticated users" ON "Job_Submissions"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Job_Submissions can be updated by the company owner" ON "Job_Submissions"
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM "Jobs"
        JOIN "Companies" ON "Jobs".company_id = "Companies".id
        WHERE "Jobs".id = "Job_Submissions".job_id
        AND "Companies".email = auth.jwt() ->> 'email'
    ));

-- CV_Screening_Results Policies
CREATE POLICY "Companies can view screening results" ON "CV_Screening_Results"
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM "Companies"
            WHERE email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Companies can create screening results" ON "CV_Screening_Results"
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM "Companies"
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Interviews Policies
CREATE POLICY "Interviews are viewable by everyone" ON "Interviews"
    FOR SELECT USING (true);

CREATE POLICY "Interviews can be inserted by authenticated users" ON "Interviews"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Interviews can be updated by the owner" ON "Interviews"
    FOR UPDATE USING (auth.jwt() ->> 'email' = useremail);

-- interview-feedback Policies
CREATE POLICY "interview-feedback are viewable by everyone" ON "interview-feedback"
    FOR SELECT USING (true);

CREATE POLICY "interview-feedback can be inserted by authenticated users" ON "interview-feedback"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_companies_email ON "Companies"(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"(email);
CREATE INDEX IF NOT EXISTS idx_users_cv_url ON "Users"(cv_url);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON "Jobs"(company_id);
CREATE INDEX IF NOT EXISTS idx_job_submissions_job_id ON "Job_Submissions"(job_id);
CREATE INDEX IF NOT EXISTS idx_job_submissions_user_id ON "Job_Submissions"(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_screening_user_id ON "CV_Screening_Results"(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_screening_company_id ON "CV_Screening_Results"(company_id);
CREATE INDEX IF NOT EXISTS idx_cv_screening_job_id ON "CV_Screening_Results"(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interview_id ON "Interviews"(interview_id);
CREATE INDEX IF NOT EXISTS idx_interviews_useremail ON "Interviews"(useremail);

-- =====================================================
-- CREATE UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create billing functions for credit system
CREATE OR REPLACE FUNCTION can_apply_for_job(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_credits INTEGER;
BEGIN
    SELECT credits INTO user_credits FROM "Users" WHERE id = user_id;
    RETURN COALESCE(user_credits, 0) > 0;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION can_upload_cv(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_credits INTEGER;
    upload_count INTEGER;
BEGIN
    SELECT credits, cv_upload_count INTO user_credits, upload_count
    FROM "Users" WHERE id = user_id;

    RETURN COALESCE(user_credits, 0) > 0 AND COALESCE(upload_count, 0) < 3;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION deduct_credits_for_application(user_id UUID, job_id UUID)
RETURNS BOOLEAN AS $$
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
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION deduct_credits_for_cv_upload(user_id UUID)
RETURNS BOOLEAN AS $$
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
$$ language 'plpgsql';

-- =====================================================
-- CREATE TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON "Companies"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "Users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON "Jobs"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_submissions_updated_at BEFORE UPDATE ON "Job_Submissions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE SETUP INSTRUCTIONS
-- =====================================================

-- IMPORTANT: Storage bucket and policies must be created SEPARATELY
-- Follow the instructions in STORAGE_SETUP_MANUAL.md for step-by-step guidance
-- This involves creating the cv-uploads bucket and setting up RLS policies through the Supabase Dashboard

-- =====================================================
-- VERIFICATION QUERIES (Run these after setup)
-- =====================================================

-- Check all tables were created
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('Companies', 'Users', 'Jobs', 'Job_Submissions', 'CV_Screening_Results', 'Interviews', 'interview-feedback')
ORDER BY tablename;

-- Check RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('Companies', 'Users', 'Jobs', 'Job_Submissions', 'CV_Screening_Results', 'Interviews', 'interview-feedback')
ORDER BY tablename;

-- Check policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check storage bucket exists (verify manually in Supabase Dashboard → Storage)
-- Bucket name: cv-uploads (should be public with 5MB file limit)

-- Check functions were created
SELECT
    proname,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('can_apply_for_job', 'can_upload_cv', 'deduct_credits_for_application', 'deduct_credits_for_cv_upload', 'update_updated_at_column')
ORDER BY proname;