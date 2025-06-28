-- Fix guest interviews by updating RLS policies
-- This script allows guest users to create interviews

-- First, check if the Interviews table exists and show its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Interviews') THEN
        RAISE NOTICE 'Interviews table exists';
    ELSE
        RAISE NOTICE 'Interviews table does not exist - please create it first';
    END IF;
END $$;

-- Show current columns in Interviews table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Interviews'
ORDER BY ordinal_position;

-- Update RLS policies to allow guest interviews
-- Drop existing policies
DROP POLICY IF EXISTS "Interviews can be inserted by authenticated users" ON "Interviews";
DROP POLICY IF EXISTS "Interviews can be inserted by authenticated users or guests" ON "Interviews";

-- Create new policy that allows both authenticated users and guest interviews
CREATE POLICY "Allow interview creation for authenticated users and guests"
  ON "Interviews" FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL OR 
    (useremail = 'guest@practice.com')
  );

-- Also ensure SELECT policy allows reading guest interviews
DROP POLICY IF EXISTS "Interviews are viewable by everyone" ON "Interviews";
CREATE POLICY "Interviews are viewable by everyone"
  ON "Interviews" FOR SELECT
  USING (true);

-- Update policy for interview-feedback table as well
DROP POLICY IF EXISTS "interview-feedback can be inserted by authenticated users" ON "interview-feedback";
DROP POLICY IF EXISTS "interview-feedback can be inserted by authenticated users or guests" ON "interview-feedback";

CREATE POLICY "Allow feedback creation for authenticated users and guests"
  ON "interview-feedback" FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL OR 
    (useremail = 'guest@practice.com')
  );

-- Ensure SELECT policy allows reading guest feedback
DROP POLICY IF EXISTS "interview-feedback are viewable by everyone" ON "interview-feedback";
CREATE POLICY "interview-feedback are viewable by everyone"
  ON "interview-feedback" FOR SELECT
  USING (true);

-- Show final policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('Interviews', 'interview-feedback')
ORDER BY tablename, policyname;
