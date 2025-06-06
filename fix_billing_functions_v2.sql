-- =====================================================
-- FIX BILLING FUNCTIONS - VERSION 2
-- Fixes ambiguous column reference errors
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Drop existing functions to recreate them properly
DROP FUNCTION IF EXISTS deduct_credits_for_application(BIGINT, BIGINT);
DROP FUNCTION IF EXISTS deduct_credits_for_application(UUID, UUID);
DROP FUNCTION IF EXISTS deduct_credits_for_application(BIGINT, UUID);
DROP FUNCTION IF EXISTS deduct_credits_for_application(UUID, BIGINT);
DROP FUNCTION IF EXISTS can_apply_for_job(BIGINT);
DROP FUNCTION IF EXISTS can_apply_for_job(UUID);

-- 2. Check what ID types we're working with
DO $$
DECLARE
    users_id_type TEXT;
    jobs_id_type TEXT;
BEGIN
    -- Get Users table ID type
    SELECT data_type INTO users_id_type
    FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'id';
    
    -- Get Jobs table ID type
    SELECT data_type INTO jobs_id_type
    FROM information_schema.columns
    WHERE table_name = 'Jobs' AND column_name = 'id';
    
    RAISE NOTICE 'Users ID type: %, Jobs ID type: %', 
                 COALESCE(users_id_type, 'NOT_EXISTS'), 
                 COALESCE(jobs_id_type, 'NOT_EXISTS');
END $$;

-- 3. Create the deduct_credits_for_application function with proper table aliases
DO $$
DECLARE
    users_id_type TEXT;
    jobs_id_type TEXT;
BEGIN
    -- Get actual ID types
    SELECT data_type INTO users_id_type
    FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'id';
    
    SELECT data_type INTO jobs_id_type
    FROM information_schema.columns
    WHERE table_name = 'Jobs' AND column_name = 'id';
    
    -- Create function based on actual ID types
    IF users_id_type = 'bigint' AND jobs_id_type = 'bigint' THEN
        -- Both are BIGINT
        EXECUTE '
        CREATE OR REPLACE FUNCTION deduct_credits_for_application(p_user_id BIGINT, p_job_id BIGINT)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
            application_exists BOOLEAN;
        BEGIN
            -- Check if user already applied for this job
            SELECT EXISTS(
                SELECT 1 FROM "Job_Submissions" js
                WHERE js.user_id = p_user_id 
                AND js.job_id = p_job_id
            ) INTO application_exists;
            
            IF application_exists THEN
                RETURN FALSE; -- Already applied
            END IF;
            
            -- Check if user has credits
            SELECT u.credits INTO user_credits 
            FROM "Users" u 
            WHERE u.id = p_user_id;
            
            IF COALESCE(user_credits, 0) > 0 THEN
                -- Deduct 1 credit and increment application count
                UPDATE "Users" u
                SET credits = u.credits - 1,
                    job_applications_count = COALESCE(u.job_applications_count, 0) + 1,
                    updated_at = NOW()
                WHERE u.id = p_user_id;
                RETURN TRUE;
            ELSE
                RETURN FALSE; -- No credits
            END IF;
        END;
        $func$ language ''plpgsql'';
        ';
        RAISE NOTICE 'Created deduct_credits_for_application function for BIGINT IDs';
        
    ELSIF users_id_type = 'uuid' AND jobs_id_type = 'uuid' THEN
        -- Both are UUID
        EXECUTE '
        CREATE OR REPLACE FUNCTION deduct_credits_for_application(p_user_id UUID, p_job_id UUID)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
            application_exists BOOLEAN;
        BEGIN
            -- Check if user already applied for this job
            SELECT EXISTS(
                SELECT 1 FROM "Job_Submissions" js
                WHERE js.user_id = p_user_id 
                AND js.job_id = p_job_id
            ) INTO application_exists;
            
            IF application_exists THEN
                RETURN FALSE; -- Already applied
            END IF;
            
            -- Check if user has credits
            SELECT u.credits INTO user_credits 
            FROM "Users" u 
            WHERE u.id = p_user_id;
            
            IF COALESCE(user_credits, 0) > 0 THEN
                -- Deduct 1 credit and increment application count
                UPDATE "Users" u
                SET credits = u.credits - 1,
                    job_applications_count = COALESCE(u.job_applications_count, 0) + 1,
                    updated_at = NOW()
                WHERE u.id = p_user_id;
                RETURN TRUE;
            ELSE
                RETURN FALSE; -- No credits
            END IF;
        END;
        $func$ language ''plpgsql'';
        ';
        RAISE NOTICE 'Created deduct_credits_for_application function for UUID IDs';
        
    ELSIF users_id_type = 'bigint' AND jobs_id_type = 'uuid' THEN
        -- Mixed: User BIGINT, Job UUID
        EXECUTE '
        CREATE OR REPLACE FUNCTION deduct_credits_for_application(p_user_id BIGINT, p_job_id UUID)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
            application_exists BOOLEAN;
        BEGIN
            -- Check if user already applied for this job
            SELECT EXISTS(
                SELECT 1 FROM "Job_Submissions" js
                WHERE js.user_id = p_user_id 
                AND js.job_id = p_job_id
            ) INTO application_exists;
            
            IF application_exists THEN
                RETURN FALSE; -- Already applied
            END IF;
            
            -- Check if user has credits
            SELECT u.credits INTO user_credits 
            FROM "Users" u 
            WHERE u.id = p_user_id;
            
            IF COALESCE(user_credits, 0) > 0 THEN
                -- Deduct 1 credit and increment application count
                UPDATE "Users" u
                SET credits = u.credits - 1,
                    job_applications_count = COALESCE(u.job_applications_count, 0) + 1,
                    updated_at = NOW()
                WHERE u.id = p_user_id;
                RETURN TRUE;
            ELSE
                RETURN FALSE; -- No credits
            END IF;
        END;
        $func$ language ''plpgsql'';
        ';
        RAISE NOTICE 'Created deduct_credits_for_application function for mixed IDs (User BIGINT, Job UUID)';
        
    ELSIF users_id_type = 'uuid' AND jobs_id_type = 'bigint' THEN
        -- Mixed: User UUID, Job BIGINT
        EXECUTE '
        CREATE OR REPLACE FUNCTION deduct_credits_for_application(p_user_id UUID, p_job_id BIGINT)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
            application_exists BOOLEAN;
        BEGIN
            -- Check if user already applied for this job
            SELECT EXISTS(
                SELECT 1 FROM "Job_Submissions" js
                WHERE js.user_id = p_user_id 
                AND js.job_id = p_job_id
            ) INTO application_exists;
            
            IF application_exists THEN
                RETURN FALSE; -- Already applied
            END IF;
            
            -- Check if user has credits
            SELECT u.credits INTO user_credits 
            FROM "Users" u 
            WHERE u.id = p_user_id;
            
            IF COALESCE(user_credits, 0) > 0 THEN
                -- Deduct 1 credit and increment application count
                UPDATE "Users" u
                SET credits = u.credits - 1,
                    job_applications_count = COALESCE(u.job_applications_count, 0) + 1,
                    updated_at = NOW()
                WHERE u.id = p_user_id;
                RETURN TRUE;
            ELSE
                RETURN FALSE; -- No credits
            END IF;
        END;
        $func$ language ''plpgsql'';
        ';
        RAISE NOTICE 'Created deduct_credits_for_application function for mixed IDs (User UUID, Job BIGINT)';
        
    ELSE
        RAISE NOTICE 'Could not determine ID types or tables do not exist';
        RAISE NOTICE 'Users ID type: %, Jobs ID type: %', users_id_type, jobs_id_type;
    END IF;
END $$;

-- 4. Create the can_apply_for_job function with proper table aliases
DO $$
DECLARE
    users_id_type TEXT;
BEGIN
    -- Get actual ID type
    SELECT data_type INTO users_id_type
    FROM information_schema.columns
    WHERE table_name = 'Users' AND column_name = 'id';
    
    -- Create function based on actual ID type
    IF users_id_type = 'bigint' THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION can_apply_for_job(p_user_id BIGINT)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
        BEGIN
            -- Check if user has credits
            SELECT u.credits INTO user_credits 
            FROM "Users" u 
            WHERE u.id = p_user_id;
            RETURN COALESCE(user_credits, 0) > 0;
        END;
        $func$ language ''plpgsql'';
        ';
        RAISE NOTICE 'Created can_apply_for_job function for BIGINT ID';
        
    ELSIF users_id_type = 'uuid' THEN
        EXECUTE '
        CREATE OR REPLACE FUNCTION can_apply_for_job(p_user_id UUID)
        RETURNS BOOLEAN AS $func$
        DECLARE
            user_credits INTEGER;
        BEGIN
            -- Check if user has credits
            SELECT u.credits INTO user_credits 
            FROM "Users" u 
            WHERE u.id = p_user_id;
            RETURN COALESCE(user_credits, 0) > 0;
        END;
        $func$ language ''plpgsql'';
        ';
        RAISE NOTICE 'Created can_apply_for_job function for UUID ID';
    ELSE
        RAISE NOTICE 'Could not determine Users ID type: %', users_id_type;
    END IF;
END $$;

-- 5. Verify the functions were created
DO $$
DECLARE
    deduct_function_exists BOOLEAN;
    can_apply_function_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'deduct_credits_for_application'
        AND routine_schema = 'public'
    ) INTO deduct_function_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'can_apply_for_job'
        AND routine_schema = 'public'
    ) INTO can_apply_function_exists;
    
    RAISE NOTICE '=== BILLING FUNCTIONS VERIFICATION ===';
    IF deduct_function_exists THEN
        RAISE NOTICE 'SUCCESS: deduct_credits_for_application function created!';
    ELSE
        RAISE NOTICE 'ERROR: deduct_credits_for_application function was not created';
    END IF;
    
    IF can_apply_function_exists THEN
        RAISE NOTICE 'SUCCESS: can_apply_for_job function created!';
    ELSE
        RAISE NOTICE 'ERROR: can_apply_for_job function was not created';
    END IF;
    
    IF deduct_function_exists AND can_apply_function_exists THEN
        RAISE NOTICE 'All billing functions are ready!';
    ELSE
        RAISE NOTICE 'Some billing functions are missing - check the logs above';
    END IF;
END $$;
