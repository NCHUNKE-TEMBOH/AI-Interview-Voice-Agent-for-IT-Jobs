-- =====================================================
-- DATABASE TEST SCRIPT
-- Run this to test if everything is working
-- =====================================================

-- 1. Test basic table access
DO $$
BEGIN
    RAISE NOTICE 'Testing basic table access...';
END $$;

-- Test Users table
SELECT 'Users table test' as test_name, COUNT(*) as record_count FROM "Users";

-- Test Companies table
SELECT 'Companies table test' as test_name, COUNT(*) as record_count FROM "Companies";

-- Test Jobs table
SELECT 'Jobs table test' as test_name, COUNT(*) as record_count FROM "Jobs";

-- Test Job_Submissions table
SELECT 'Job_Submissions table test' as test_name, COUNT(*) as record_count FROM "Job_Submissions";

-- 2. Test foreign key relationships
DO $$
BEGIN
    RAISE NOTICE 'Testing foreign key relationships...';
END $$;

-- Test Jobs -> Companies relationship
SELECT 
    'Jobs-Companies relationship' as test_name,
    COUNT(j.*) as jobs_count,
    COUNT(c.*) as companies_count
FROM "Jobs" j
LEFT JOIN "Companies" c ON j.company_id = c.id
LIMIT 5;

-- Test Job_Submissions -> Jobs relationship
SELECT 
    'Job_Submissions-Jobs relationship' as test_name,
    COUNT(js.*) as submissions_count,
    COUNT(j.*) as jobs_count
FROM "Job_Submissions" js
LEFT JOIN "Jobs" j ON js.job_id = j.id
LIMIT 5;

-- 3. Test billing functions (if they exist)
DO $$
DECLARE
    function_exists BOOLEAN;
    test_result BOOLEAN;
BEGIN
    -- Check if can_apply_for_job function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'can_apply_for_job'
    ) INTO function_exists;
    
    IF function_exists THEN
        RAISE NOTICE 'Billing functions exist - testing with dummy data...';
        
        -- Test with a dummy UUID (this will return false but shouldn't error)
        SELECT can_apply_for_job('00000000-0000-0000-0000-000000000000'::uuid) INTO test_result;
        RAISE NOTICE 'can_apply_for_job test result: %', test_result;
    ELSE
        RAISE NOTICE 'Billing functions do not exist - this is OK for basic functionality';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error testing billing functions: %', SQLERRM;
END $$;

-- 4. Test storage bucket (if accessible)
DO $$
DECLARE
    bucket_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'cv-uploads'
    ) INTO bucket_exists;
    
    RAISE NOTICE 'CV uploads bucket exists: %', bucket_exists;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Cannot access storage buckets: %', SQLERRM;
END $$;

-- 5. Show table structures
DO $$
BEGIN
    RAISE NOTICE 'Table structure summary:';
END $$;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('Users', 'Companies', 'Jobs', 'Job_Submissions', 'CV_Screening_Results')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 6. Show foreign key constraints
DO $$
BEGIN
    RAISE NOTICE 'Foreign key constraints:';
END $$;

SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 7. Test sample queries that the app will use
DO $$
BEGIN
    RAISE NOTICE 'Testing application queries...';
END $$;

-- Test query similar to what the application uses
SELECT 
    'Application query test' as test_name,
    js.id,
    js.user_email,
    j.job_title,
    c.name as company_name
FROM "Job_Submissions" js
LEFT JOIN "Jobs" j ON js.job_id = j.id
LEFT JOIN "Companies" c ON j.company_id = c.id
LIMIT 3;

-- Final summary
DO $$
DECLARE
    users_count INTEGER;
    companies_count INTEGER;
    jobs_count INTEGER;
    submissions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_count FROM "Users";
    SELECT COUNT(*) INTO companies_count FROM "Companies";
    SELECT COUNT(*) INTO jobs_count FROM "Jobs";
    SELECT COUNT(*) INTO submissions_count FROM "Job_Submissions";
    
    RAISE NOTICE '=== DATABASE TEST SUMMARY ===';
    RAISE NOTICE 'Users: % records', users_count;
    RAISE NOTICE 'Companies: % records', companies_count;
    RAISE NOTICE 'Jobs: % records', jobs_count;
    RAISE NOTICE 'Job_Submissions: % records', submissions_count;
    RAISE NOTICE '=== END SUMMARY ===';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in summary: %', SQLERRM;
END $$;
