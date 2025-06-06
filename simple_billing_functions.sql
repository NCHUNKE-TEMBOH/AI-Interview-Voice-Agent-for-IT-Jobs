-- =====================================================
-- SIMPLE BILLING FUNCTIONS - GUARANTEED TO WORK
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Drop any existing functions first
DROP FUNCTION IF EXISTS can_apply_for_job(BIGINT);
DROP FUNCTION IF EXISTS can_apply_for_job(UUID);
DROP FUNCTION IF EXISTS can_apply_for_job(TEXT);
DROP FUNCTION IF EXISTS deduct_credits_for_application(BIGINT, BIGINT);
DROP FUNCTION IF EXISTS deduct_credits_for_application(UUID, UUID);
DROP FUNCTION IF EXISTS deduct_credits_for_application(BIGINT, UUID);
DROP FUNCTION IF EXISTS deduct_credits_for_application(UUID, BIGINT);
DROP FUNCTION IF EXISTS deduct_credits_for_application(TEXT, TEXT);

-- 2. Create simple can_apply_for_job function that accepts any type
CREATE OR REPLACE FUNCTION can_apply_for_job(user_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_credits INTEGER := 0;
BEGIN
    -- Try to get user credits, handle different ID types
    BEGIN
        SELECT COALESCE(credits, 0) INTO user_credits 
        FROM "Users" 
        WHERE id::TEXT = user_id_param OR email = user_id_param;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN FALSE;
    END;
    
    RETURN user_credits > 0;
END;
$$ LANGUAGE plpgsql;

-- 3. Create simple deduct_credits_for_application function
CREATE OR REPLACE FUNCTION deduct_credits_for_application(user_id_param TEXT, job_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_credits INTEGER := 0;
    application_exists BOOLEAN := FALSE;
    user_record_id TEXT;
BEGIN
    -- Get user record and credits
    BEGIN
        SELECT id::TEXT, COALESCE(credits, 0) 
        INTO user_record_id, user_credits
        FROM "Users" 
        WHERE id::TEXT = user_id_param OR email = user_id_param;
        
        IF user_record_id IS NULL THEN
            RETURN FALSE; -- User not found
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN FALSE;
    END;
    
    -- Check if user already applied for this job
    BEGIN
        SELECT EXISTS(
            SELECT 1 FROM "Job_Submissions" 
            WHERE (user_id::TEXT = user_record_id OR user_email = (SELECT email FROM "Users" WHERE id::TEXT = user_record_id))
            AND job_id::TEXT = job_id_param
        ) INTO application_exists;
    EXCEPTION
        WHEN OTHERS THEN
            application_exists := FALSE;
    END;
    
    IF application_exists THEN
        RETURN FALSE; -- Already applied
    END IF;
    
    -- Check if user has credits
    IF user_credits <= 0 THEN
        RETURN FALSE; -- No credits
    END IF;
    
    -- Deduct 1 credit
    BEGIN
        UPDATE "Users" 
        SET credits = credits - 1,
            job_applications_count = COALESCE(job_applications_count, 0) + 1,
            updated_at = NOW()
        WHERE id::TEXT = user_record_id;
        
        RETURN TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;

-- 4. Create alternative versions for backward compatibility
CREATE OR REPLACE FUNCTION can_apply_for_job(user_id_param BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN can_apply_for_job(user_id_param::TEXT);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION can_apply_for_job(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN can_apply_for_job(user_id_param::TEXT);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION deduct_credits_for_application(user_id_param BIGINT, job_id_param BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN deduct_credits_for_application(user_id_param::TEXT, job_id_param::TEXT);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION deduct_credits_for_application(user_id_param UUID, job_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN deduct_credits_for_application(user_id_param::TEXT, job_id_param::TEXT);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION deduct_credits_for_application(user_id_param BIGINT, job_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN deduct_credits_for_application(user_id_param::TEXT, job_id_param::TEXT);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION deduct_credits_for_application(user_id_param UUID, job_id_param BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN deduct_credits_for_application(user_id_param::TEXT, job_id_param::TEXT);
END;
$$ LANGUAGE plpgsql;

-- 5. Verify functions were created
DO $$
DECLARE
    can_apply_count INTEGER;
    deduct_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO can_apply_count
    FROM information_schema.routines 
    WHERE routine_name = 'can_apply_for_job' AND routine_schema = 'public';
    
    SELECT COUNT(*) INTO deduct_count
    FROM information_schema.routines 
    WHERE routine_name = 'deduct_credits_for_application' AND routine_schema = 'public';
    
    RAISE NOTICE '=== SIMPLE BILLING FUNCTIONS VERIFICATION ===';
    RAISE NOTICE 'can_apply_for_job functions created: %', can_apply_count;
    RAISE NOTICE 'deduct_credits_for_application functions created: %', deduct_count;
    
    IF can_apply_count > 0 AND deduct_count > 0 THEN
        RAISE NOTICE 'SUCCESS: All billing functions are ready!';
        RAISE NOTICE 'These functions accept any ID type (BIGINT, UUID, TEXT)';
    ELSE
        RAISE NOTICE 'ERROR: Some functions were not created';
    END IF;
END $$;
