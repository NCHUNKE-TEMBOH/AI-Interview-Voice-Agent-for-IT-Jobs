# Supabase Storage Setup Instructions

## 1. Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"Create a new bucket"**
4. Set the following:
   - **Name**: `cv-uploads`
   - **Public bucket**: ✅ **Enabled** (check this box)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document`

## 2. Set Up Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies:

### Go to Storage Policies
1. In the Storage section, click on your `cv-uploads` bucket
2. Click on **"Policies"** tab
3. Click **"Add policy"**

### Policy 1: Allow Users to Upload Their Own CVs
```sql
-- Policy Name: Users can upload their own CVs
-- Operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Users can upload their own CVs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'cv-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Allow Users to View Their Own CVs
```sql
-- Policy Name: Users can view their own CVs
-- Operation: SELECT
-- Target roles: authenticated

CREATE POLICY "Users can view their own CVs" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'cv-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Allow Users to Update Their Own CVs
```sql
-- Policy Name: Users can update their own CVs
-- Operation: UPDATE
-- Target roles: authenticated

CREATE POLICY "Users can update their own CVs" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'cv-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 4: Allow Users to Delete Their Own CVs
```sql
-- Policy Name: Users can delete their own CVs
-- Operation: DELETE
-- Target roles: authenticated

CREATE POLICY "Users can delete their own CVs" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'cv-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 5: Allow Companies to View CVs (for screening)
```sql
-- Policy Name: Companies can view CVs for screening
-- Operation: SELECT
-- Target roles: authenticated

CREATE POLICY "Companies can view CVs for screening" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'cv-uploads' AND
  EXISTS (
    SELECT 1 FROM "Companies" 
    WHERE email = auth.jwt() ->> 'email'
  )
);
```

## 3. Alternative: Run Policies via SQL Editor

If you prefer to set up all policies at once, go to **SQL Editor** in your Supabase dashboard and run:

```sql
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (optional)
DROP POLICY IF EXISTS "Users can upload their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Companies can view CVs for screening" ON storage.objects;

-- Create new policies
CREATE POLICY "Users can upload their own CVs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'cv-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own CVs" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'cv-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own CVs" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'cv-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own CVs" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'cv-uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Companies can view CVs for screening" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'cv-uploads' AND
  EXISTS (
    SELECT 1 FROM "Companies" 
    WHERE email = auth.jwt() ->> 'email'
  )
);
```

## 4. Verify Setup

After setting up the bucket and policies:

1. **Test CV Upload**: Try uploading a CV from the user profile page
2. **Check File Structure**: Files should be stored as `{user_id}/cv.{extension}`
3. **Test Permissions**: Ensure users can only access their own files
4. **Test Company Access**: Companies should be able to view CVs for screening

## 5. Troubleshooting

### Common Issues:

1. **"Upload error: {}"**
   - Check if the bucket exists and is public
   - Verify RLS policies are correctly set up
   - Ensure the user is authenticated

2. **Permission Denied**
   - Check if RLS policies match the file path structure
   - Verify the user ID in the file path matches the authenticated user

3. **File Not Found**
   - Ensure the bucket name is exactly `cv-uploads`
   - Check if the file path follows the pattern `{user_id}/cv.{extension}`

### Debug Steps:

1. Check browser console for detailed error messages
2. Verify in Supabase Storage that files are being created
3. Test policies in the Supabase SQL editor
4. Ensure authentication is working properly

## 6. File Structure

The CV files will be organized as follows:
```
cv-uploads/
├── {user-id-1}/
│   └── cv.pdf
├── {user-id-2}/
│   └── cv.docx
└── {user-id-3}/
    └── cv.pdf
```

This structure ensures:
- Each user has their own folder
- Only one CV per user (replacements overwrite)
- Clear organization for company screening
- Secure access control via RLS policies
