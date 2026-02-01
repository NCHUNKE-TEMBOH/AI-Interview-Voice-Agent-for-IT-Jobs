-- =====================================================
-- COMPLETE STORAGE FIX FOR CV UPLOADS
-- This script ensures the bucket exists and policies work
-- =====================================================

-- 1. Ensure the bucket exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-uploads',
  'cv-uploads',
  true,
  5242880, -- 5MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- 2. Drop ALL existing policies
DROP POLICY IF EXISTS "Users can upload their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Companies can view CVs for screening" ON storage.objects;
DROP POLICY IF EXISTS "Public CV access" ON storage.objects;
DROP POLICY IF EXISTS "Allow CV uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow CV viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow CV updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow CV deletion" ON storage.objects;
DROP POLICY IF EXISTS "CV Uploads - Full Access" ON storage.objects;
DROP POLICY IF EXISTS "CV Uploads - Allow Everything" ON storage.objects;

-- 3. Create working policies
-- Allow all operations for authenticated users on cv-uploads bucket
CREATE POLICY "cv_uploads_policy" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'cv-uploads')
WITH CHECK (bucket_id = 'cv-uploads');

-- 4. Alternative: If the above doesn't work, try service role access
-- Uncomment this if you still get permission errors
/*
CREATE POLICY "cv_uploads_service_role" ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'cv-uploads')
WITH CHECK (bucket_id = 'cv-uploads');
*/

-- 5. Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 6. Verification queries
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
  AND policyname = 'cv_uploads_policy';

-- Check bucket
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'cv-uploads';

-- Test if we can see existing objects (should work now)
SELECT COUNT(*) as object_count
FROM storage.objects
WHERE bucket_id = 'cv-uploads';</content>
</xai:function_call/>
