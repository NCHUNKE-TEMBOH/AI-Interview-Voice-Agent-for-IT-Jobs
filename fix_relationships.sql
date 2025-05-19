-- This script establishes proper foreign key relationships between tables

-- First, let's check if the job_id column in Job_Submissions is properly defined as a foreign key
ALTER TABLE "Job_Submissions" 
DROP CONSTRAINT IF EXISTS "Job_Submissions_job_id_fkey";

-- Add the foreign key constraint
ALTER TABLE "Job_Submissions" 
ADD CONSTRAINT "Job_Submissions_job_id_fkey" 
FOREIGN KEY ("job_id") 
REFERENCES "Jobs"("id") 
ON DELETE CASCADE;

-- Create an index on job_id to improve query performance
CREATE INDEX IF NOT EXISTS "idx_job_submissions_job_id" 
ON "Job_Submissions"("job_id");

-- Create an index on company_id in Jobs table
CREATE INDEX IF NOT EXISTS "idx_jobs_company_id" 
ON "Jobs"("company_id");

-- Add a count function for Job_Submissions
CREATE OR REPLACE FUNCTION get_submission_count(job_id UUID) 
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
