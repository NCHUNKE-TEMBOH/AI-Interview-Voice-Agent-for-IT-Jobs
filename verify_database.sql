-- =====================================================
-- DATABASE VERIFICATION SCRIPT
-- Run this to check your database structure
-- =====================================================

-- Check what tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check table structures and ID types
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('Users', 'Companies', 'Jobs', 'Job_Submissions', 'CV_Screening_Results')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check foreign key constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
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

-- Check if billing functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name LIKE '%credit%'
ORDER BY routine_name;

-- Sample data check
SELECT 'Users' as table_name, COUNT(*) as record_count FROM "Users"
UNION ALL
SELECT 'Companies' as table_name, COUNT(*) as record_count FROM "Companies"
UNION ALL
SELECT 'Jobs' as table_name, COUNT(*) as record_count FROM "Jobs"
UNION ALL
SELECT 'Job_Submissions' as table_name, COUNT(*) as record_count FROM "Job_Submissions"
UNION ALL
SELECT 'CV_Screening_Results' as table_name, COUNT(*) as record_count FROM "CV_Screening_Results";

-- Check storage buckets (if accessible)
SELECT 
    name,
    public
FROM storage.buckets
WHERE name = 'cv-uploads';

-- Check storage policies (if accessible)
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%cv%';
