-- Drop and recreate the Interviews table with the correct structure
DROP TABLE IF EXISTS "Interviews";
CREATE TABLE "Interviews" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id TEXT UNIQUE,
  userEmail TEXT NOT NULL,
  userName TEXT,
  jobPosition TEXT,
  jobDescription TEXT,
  type TEXT,
  duration INTEGER,
  experienceLevel TEXT,
  requiredSkills TEXT,
  companyCriteria TEXT,
  questionList JSONB,
  companyId UUID,
  jobId UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for Interviews
ALTER TABLE "Interviews" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interviews are viewable by everyone"
  ON "Interviews" FOR SELECT
  USING (true);
  
CREATE POLICY "Interviews can be inserted by authenticated users"
  ON "Interviews" FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
  
CREATE POLICY "Interviews can be updated by the owner"
  ON "Interviews" FOR UPDATE
  USING (auth.email() = userEmail);

-- Drop and recreate the interview-feedback table with the correct structure
DROP TABLE IF EXISTS "interview-feedback";
CREATE TABLE "interview-feedback" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id TEXT,
  userEmail TEXT NOT NULL,
  userName TEXT,
  feedback JSONB,
  recommended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for interview-feedback
ALTER TABLE "interview-feedback" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interview-feedback are viewable by everyone"
  ON "interview-feedback" FOR SELECT
  USING (true);
  
CREATE POLICY "interview-feedback can be inserted by authenticated users"
  ON "interview-feedback" FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Drop and recreate the Job_Submissions table with the correct structure
DROP TABLE IF EXISTS "Job_Submissions";
CREATE TABLE "Job_Submissions" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID,
  user_name TEXT,
  user_email TEXT,
  feedback JSONB,
  score INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for Job_Submissions
ALTER TABLE "Job_Submissions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job_Submissions are viewable by everyone"
  ON "Job_Submissions" FOR SELECT
  USING (true);
  
CREATE POLICY "Job_Submissions can be inserted by authenticated users"
  ON "Job_Submissions" FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
  
CREATE POLICY "Job_Submissions can be updated by the company owner"
  ON "Job_Submissions" FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM "Jobs"
    JOIN "Companies" ON "Jobs".company_id = "Companies".id
    WHERE "Jobs".id = "Job_Submissions".job_id
    AND "Companies".email = auth.email()
  ));
