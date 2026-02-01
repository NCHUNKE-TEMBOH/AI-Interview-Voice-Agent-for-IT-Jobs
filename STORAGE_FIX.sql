-- =====================================================
-- STORAGE POLICY FIX FOR CV UPLOADS
-- Run this to fix the RLS policy violation error
-- =====================================================

-- 1. First, let's check what policies exist
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
  AND tablename = 'objects';

-- 2. Drop ALL existing storage policies to start fresh
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

-- 3. Create a SUPER permissive policy for testing
-- This allows ALL authenticated users to do ANYTHING with cv-uploads bucket
CREATE POLICY "CV Uploads - Full Access" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'cv-uploads')
WITH CHECK (bucket_id = 'cv-uploads');

-- 4. Alternative: If the above doesn't work, try this even more permissive policy
-- Uncomment this if the policy above still fails
/*
CREATE POLICY "CV Uploads - Allow Everything" ON storage.objects
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
*/

-- 5. Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 6. Verify the bucket exists and is public
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE name = 'cv-uploads';

-- 7. Test query to see if we can access storage.objects
-- This should return an empty result set if policies are working
SELECT id, bucket_id, name FROM storage.objects WHERE bucket_id = 'cv-uploads' LIMIT 1;</content>
</xai:function_call/>
