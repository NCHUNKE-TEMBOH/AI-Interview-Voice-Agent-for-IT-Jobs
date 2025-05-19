-- This script fixes database issues related to the Job_Submissions table

-- First, let's make sure the job_id column in Job_Submissions is properly defined
ALTER TABLE "Job_Submissions" 
ALTER COLUMN "job_id" TYPE UUID USING "job_id"::UUID;

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS "idx_job_submissions_job_id" 
ON "Job_Submissions"("job_id");

CREATE INDEX IF NOT EXISTS "idx_job_submissions_status" 
ON "Job_Submissions"("status");

CREATE INDEX IF NOT EXISTS "idx_job_submissions_created_at" 
ON "Job_Submissions"("created_at");

-- Add a function to count submissions for a job
CREATE OR REPLACE FUNCTION get_job_submission_count(job_id UUID) 
RETURNS INTEGER AS $$
DECLARE
  submission_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO submission_count 
  FROM "Job_Submissions" 
  WHERE "job_id" = $1;
  
  RETURN submission_count;
END;
$$ LANGUAGE plpgsql;

-- Add a view to make it easier to query submissions with job details
CREATE OR REPLACE VIEW "job_submissions_with_jobs" AS
SELECT 
  js.*,
  j.job_title,
  j.company_id,
  j.job_description,
  j.required_skills,
  j.experience_level
FROM 
  "Job_Submissions" js
JOIN 
  "Jobs" j ON js.job_id = j.id;

-- Update RLS policies for Job_Submissions
DROP POLICY IF EXISTS "Job_Submissions are viewable by everyone" ON "Job_Submissions";
DROP POLICY IF EXISTS "Job_Submissions can be inserted by authenticated users" ON "Job_Submissions";
DROP POLICY IF EXISTS "Job_Submissions can be updated by the company owner" ON "Job_Submissions";

-- Create new policies
CREATE POLICY "Job_Submissions are viewable by everyone"
  ON "Job_Submissions" FOR SELECT
  USING (true);
  
CREATE POLICY "Job_Submissions can be inserted by authenticated users"
  ON "Job_Submissions" FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
  
CREATE POLICY "Job_Submissions can be updated by anyone"
  ON "Job_Submissions" FOR UPDATE
  USING (true);

-- Make sure the Jobs table has the right indexes
CREATE INDEX IF NOT EXISTS "idx_jobs_company_id" 
ON "Jobs"("company_id");

CREATE INDEX IF NOT EXISTS "idx_jobs_created_at" 
ON "Jobs"("created_at");
