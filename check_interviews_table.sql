-- =====================================================
-- CHECK INTERVIEWS TABLE STRUCTURE
-- Run this in Supabase SQL Editor to see what columns exist
-- =====================================================

-- 1. Check if Interviews table exists
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Interviews'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Interviews table exists';
    ELSE
        RAISE NOTICE 'Interviews table does NOT exist';
    END IF;
END $$;

-- 2. Show all columns in Interviews table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Interviews'
ORDER BY ordinal_position;

-- 3. Show sample data structure (if any data exists)
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM "Interviews" LIMIT 1;
    
    IF row_count > 0 THEN
        RAISE NOTICE 'Sample data found in Interviews table';
    ELSE
        RAISE NOTICE 'No data found in Interviews table';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not check Interviews table data: %', SQLERRM;
END $$;

-- 4. Check for common column variations
DO $$
DECLARE
    has_jobDescription BOOLEAN := FALSE;
    has_job_description BOOLEAN := FALSE;
    has_jobdescription_lower BOOLEAN := FALSE;
    has_description BOOLEAN := FALSE;
BEGIN
    -- Check for different variations of job description column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Interviews' AND column_name = 'jobDescription'
    ) INTO has_jobDescription;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Interviews' AND column_name = 'job_description'
    ) INTO has_job_description;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Interviews' AND column_name = 'jobdescription'
    ) INTO has_jobdescription_lower;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Interviews' AND column_name = 'description'
    ) INTO has_description;
    
    RAISE NOTICE '=== JOB DESCRIPTION COLUMN CHECK ===';
    RAISE NOTICE 'jobDescription: %', has_jobDescription;
    RAISE NOTICE 'job_description: %', has_job_description;
    RAISE NOTICE 'jobdescription: %', has_jobdescription_lower;
    RAISE NOTICE 'description: %', has_description;
    
    IF NOT (has_jobDescription OR has_job_description OR has_jobdescription_lower OR has_description) THEN
        RAISE NOTICE 'No job description column found - this is likely the cause of the error';
    END IF;
END $$;

-- 5. Check for other common columns that might be missing
DO $$
DECLARE
    has_jobPosition BOOLEAN := FALSE;
    has_job_position BOOLEAN := FALSE;
    has_jobposition BOOLEAN := FALSE;
    has_position BOOLEAN := FALSE;
    has_duration BOOLEAN := FALSE;
    has_type BOOLEAN := FALSE;
    has_questionList BOOLEAN := FALSE;
    has_question_list BOOLEAN := FALSE;
    has_questionlist BOOLEAN := FALSE;
BEGIN
    -- Check for job position variations
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Interviews' AND column_name = 'jobPosition') INTO has_jobPosition;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Interviews' AND column_name = 'job_position') INTO has_job_position;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Interviews' AND column_name = 'jobposition') INTO has_jobposition;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Interviews' AND column_name = 'position') INTO has_position;
    
    -- Check for other columns
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Interviews' AND column_name = 'duration') INTO has_duration;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Interviews' AND column_name = 'type') INTO has_type;
    
    -- Check for question list variations
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Interviews' AND column_name = 'questionList') INTO has_questionList;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Interviews' AND column_name = 'question_list') INTO has_question_list;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Interviews' AND column_name = 'questionlist') INTO has_questionlist;
    
    RAISE NOTICE '=== OTHER COLUMNS CHECK ===';
    RAISE NOTICE 'Job Position - jobPosition: %, job_position: %, jobposition: %, position: %', 
                 has_jobPosition, has_job_position, has_jobposition, has_position;
    RAISE NOTICE 'Duration: %', has_duration;
    RAISE NOTICE 'Type: %', has_type;
    RAISE NOTICE 'Question List - questionList: %, question_list: %, questionlist: %', 
                 has_questionList, has_question_list, has_questionlist;
END $$;
