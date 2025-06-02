-- =====================================================
-- FIX STORAGE POLICIES FOR CV UPLOADS
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create the cv-uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can upload their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Companies can view CVs for screening" ON storage.objects;
DROP POLICY IF EXISTS "Public CV access" ON storage.objects;

-- 3. Create simple, permissive policies for CV uploads
-- Allow authenticated users to upload to cv-uploads bucket
CREATE POLICY "Allow CV uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cv-uploads');

-- Allow authenticated users to view files in cv-uploads bucket
CREATE POLICY "Allow CV viewing" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'cv-uploads');

-- Allow authenticated users to update files in cv-uploads bucket
CREATE POLICY "Allow CV updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'cv-uploads');

-- Allow authenticated users to delete files in cv-uploads bucket
CREATE POLICY "Allow CV deletion" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'cv-uploads');

-- 4. Alternative: Create a very permissive policy for testing
-- Uncomment this if the above policies still don't work
/*
CREATE POLICY "Allow all CV operations" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'cv-uploads')
WITH CHECK (bucket_id = 'cv-uploads');
*/

-- 5. Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 6. Verify the setup
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%CV%' OR policyname LIKE '%cv%';

-- 7. Check bucket exists
SELECT id, name, public FROM storage.buckets WHERE name = 'cv-uploads';
