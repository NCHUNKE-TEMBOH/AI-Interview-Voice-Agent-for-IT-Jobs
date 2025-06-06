-- =====================================================
-- FINAL BILLING FIX - SINGLE FUNCTIONS ONLY
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Drop ALL existing billing functions
DROP FUNCTION IF EXISTS can_apply_for_job(BIGINT);
DROP FUNCTION IF EXISTS can_apply_for_job(UUID);
DROP FUNCTION IF EXISTS can_apply_for_job(TEXT);
DROP FUNCTION IF EXISTS deduct_credits_for_application(BIGINT, BIGINT);
DROP FUNCTION IF EXISTS deduct_credits_for_application(UUID, UUID);
DROP FUNCTION IF EXISTS deduct_credits_for_application(BIGINT, UUID);
DROP FUNCTION IF EXISTS deduct_credits_for_application(UUID, BIGINT);
DROP FUNCTION IF EXISTS deduct_credits_for_application(TEXT, TEXT);

-- 2. Create SINGLE can_apply_for_job function
CREATE OR REPLACE FUNCTION can_apply_for_job(user_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_credits INTEGER := 0;
BEGIN
    SELECT COALESCE(credits, 0) INTO user_credits 
    FROM "Users" 
    WHERE id::TEXT = user_id_param;
    
    RETURN user_credits > 0;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 3. Create SINGLE deduct_credits_for_application function
CREATE OR REPLACE FUNCTION deduct_credits_for_application(user_id_param TEXT, job_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_credits INTEGER := 0;
    application_exists BOOLEAN := FALSE;
BEGIN
    -- Check if user already applied
    SELECT EXISTS(
        SELECT 1 FROM "Job_Submissions" 
        WHERE user_id::TEXT = user_id_param 
        AND job_id::TEXT = job_id_param
    ) INTO application_exists;
    
    IF application_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Get user credits
    SELECT COALESCE(credits, 0) INTO user_credits 
    FROM "Users" 
    WHERE id::TEXT = user_id_param;
    
    IF user_credits <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credit
    UPDATE "Users" 
    SET credits = credits - 1,
        job_applications_count = COALESCE(job_applications_count, 0) + 1
    WHERE id::TEXT = user_id_param;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 4. Verify functions exist
SELECT 'can_apply_for_job' as function_name, COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name = 'can_apply_for_job' AND routine_schema = 'public'
UNION ALL
SELECT 'deduct_credits_for_application' as function_name, COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name = 'deduct_credits_for_application' AND routine_schema = 'public';
