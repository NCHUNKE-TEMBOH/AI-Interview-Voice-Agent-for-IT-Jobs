-- =====================================================
-- FIXED DATABASE SETUP FOR AI INTERVIEW VOICE AGENT
-- This version fixes the company onboarding error
-- Copy and paste this entire script into Supabase SQL Editor
-- =====================================================

-- Fix Companies table to match form expectations
ALTER TABLE "Companies"
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS company_email TEXT DEFAULT '';

-- Fix RLS policies for Companies table
DROP POLICY IF EXISTS "Companies can view own data" ON "Companies";
DROP POLICY IF EXISTS "Companies can update own data" ON "Companies";
DROP POLICY IF EXISTS "Companies can insert own data" ON "Companies";

-- Create proper RLS policies
CREATE POLICY "Companies can view own data" ON "Companies"
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Companies can update own data" ON "Companies"
    FOR UPDATE USING (auth.jwt() ->> 'email' = email)
    WITH CHECK (auth.jwt() ->> 'email' = email);

CREATE POLICY "Companies can insert own data" ON "Companies"
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- VERIFICATION: Test the company update
-- =====================================================

-- This query should work now for authenticated company users
-- SELECT * FROM "Companies" WHERE email = auth.jwt() ->> 'email';

-- Test update query (this should work now)
-- UPDATE "Companies"
-- SET name = 'Test Company', address = 'Test Address', is_onboarded = true
-- WHERE email = auth.jwt() ->> 'email';</content>
</xai:function_call/>
