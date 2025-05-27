-- Drop existing tables to recreate them with the correct structure
DROP TABLE IF EXISTS "interview-feedback";
DROP TABLE IF EXISTS "Interviews";
DROP TABLE IF EXISTS "Job_Submissions";

-- Create the Interviews table with the exact column names used in the code
CREATE TABLE "Interviews" (
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
  companycriteria TEXT,  -- This matches the code now
  questionlist JSONB,
  companyid UUID,
  jobid UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row-Level Security
ALTER TABLE "Interviews" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Interviews are viewable by everyone"
  ON "Interviews" FOR SELECT
  USING (true);

CREATE POLICY "Interviews can be inserted by authenticated users"
  ON "Interviews" FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Interviews can be updated by the owner"
  ON "Interviews" FOR UPDATE
  USING (auth.email() = useremail);

-- Create the interview-feedback table
CREATE TABLE "interview-feedback" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id TEXT REFERENCES "Interviews"(interview_id),
  useremail TEXT NOT NULL,
  username TEXT,
  feedback JSONB,
  recommended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row-Level Security
ALTER TABLE "interview-feedback" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "interview-feedback are viewable by everyone"
  ON "interview-feedback" FOR SELECT
  USING (true);

CREATE POLICY "interview-feedback can be inserted by authenticated users"
  ON "interview-feedback" FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create the Job_Submissions table
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

-- Enable Row-Level Security
ALTER TABLE "Job_Submissions" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
