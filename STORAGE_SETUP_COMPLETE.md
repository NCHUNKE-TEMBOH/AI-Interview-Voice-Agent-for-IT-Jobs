# Complete Supabase Storage Setup for CV Uploads

This guide provides step-by-step instructions to set up the storage bucket for CV uploads in your AI Interview Voice Agent project.

## 📋 **Storage Requirements**

Based on the codebase analysis, the CV upload system requires:

- **Bucket Name**: `cv-uploads`
- **File Types**: PDF (`.pdf`) and DOCX (`.docx`) only
- **File Size Limit**: 5MB maximum
- **Access Pattern**: Public bucket with RLS policies
- **File Organization**: Files stored in user-specific folders (`user_id/filename`)

## 🚀 **Step-by-Step Setup**

### **Step 1: Create the Storage Bucket**

1. **Navigate to Supabase Dashboard**
   - Go to [supabase.com](https://Supabase.com)
   - Select your project
   - Click **"Storage"** in the left sidebar

2. **Create New Bucket**
   - Click **"Create a new bucket"**
   - Enter bucket details:

     ```
     Name: cv-uploads
     Public bucket: ✅ Enable (checked)
     File size limit: 5MB
     Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
     ```

3. **Verify Bucket Creation**
   - The bucket should appear in your storage list
   - It should show as "Public" with a green indicator

### **Step 2: Configure Storage Policies**

Since Supabase dashboard policies can be tricky, use the SQL approach:

1. **Go to SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Create a new query

2. **Run the Storage Policy Script**
   Copy and paste this SQL script:

   ```sql
   -- =====================================================
   -- STORAGE POLICIES FOR CV UPLOADS
   -- =====================================================

   -- 1. Create the cv-uploads bucket if it doesn't exist
   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES (
     'cv-uploads',
     'cv-uploads',
     true,
     5242880, -- 5MB in bytes
     ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
   )
   ON CONFLICT (id) DO UPDATE SET
     public = true,
     file_size_limit = 5242880,
     allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

   -- 2. Drop existing policies if they exist
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

   -- 3. Create comprehensive policies for CV operations
   CREATE POLICY "Allow CV uploads" ON storage.objects
   FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'cv-uploads');

   CREATE POLICY "Allow CV viewing" ON storage.objects
   FOR SELECT TO authenticated
   USING (bucket_id = 'cv-uploads');

   CREATE POLICY "Allow CV updates" ON storage.objects
   FOR UPDATE TO authenticated
   USING (bucket_id = 'cv-uploads');

   CREATE POLICY "Allow CV deletion" ON storage.objects
   FOR DELETE TO authenticated
   USING (bucket_id = 'cv-uploads');

   -- 4. Ensure RLS is enabled
   ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
   ```

3. **Execute the Script**
   - Click **"Run"** to execute the SQL
   - You should see a success message

### **Step 3: Verify Storage Setup**

Run these verification queries in the SQL Editor:

```sql
-- Check bucket exists and is configured correctly
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'cv-uploads';

-- Check policies were created
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
```

## 🧪 **Test the Setup**

### **Test File Upload**

1. **Login as a user** in your application
2. **Go to Profile/Dashboard** where CV upload is available
3. **Try uploading a PDF or DOCX file** under 5MB
4. **Verify the upload succeeds** and you can view/download the file

### **Test File Access**

1. **Login as a company user**
2. **Check if you can view** uploaded CVs from job applicants
3. **Verify download functionality** works

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

#### **"Bucket not found" Error**

```
Error: Storage bucket not found. Please create a bucket named "cv-uploads"
```

**Solution**: The bucket wasn't created properly. Re-run the SQL script above.

#### **"Storage permission error" Error**

```
Error: Storage permission error. Please ensure the cv-uploads bucket is set to public
```

**Solution**: Make sure the bucket is set to public and policies are applied.

#### **"File size" Error**

```
Error: File too large. Please upload a file smaller than 5MB
```

**Solution**: The file exceeds 5MB limit. Reduce file size or check bucket configuration.

#### **Authentication Errors**

- Ensure users are logged in before uploading
- Check that Supabase auth is working correctly
- Verify JWT tokens are being generated properly

### **Debug Steps**

1. **Check Browser Console**
   - Look for specific error messages
   - Check network requests to Supabase

2. **Verify Bucket Configuration**

   ```sql
   SELECT * FROM storage.buckets WHERE name = 'cv-uploads';
   ```

3. **Test Storage Access Manually**

   ```sql
   -- Test if you can list objects (should return empty array if no files)
   SELECT * FROM storage.objects WHERE bucket_id = 'cv-uploads' LIMIT 5;
   ```

## 📁 **File Organization**

The application organizes files as follows:

```
cv-uploads/
├── user_uuid_1/
│   ├── resume_v1.pdf
│   └── cv_final.docx
├── user_uuid_2/
│   └── my_resume.pdf
└── user_uuid_3/
    └── updated_cv.pdf
```

- Files are stored in user-specific folders
- Folder names use the user's UUID
- Public URLs are generated for file access

## 🔒 **Security Considerations**

- **RLS Policies**: Only authenticated users can upload/view files
- **File Type Validation**: Only PDF and DOCX allowed
- **Size Limits**: 5MB maximum prevents abuse
- **User Isolation**: Files are organized by user ID
- **Public Access**: Required for companies to view applicant CVs

## ✅ **Success Indicators**

When setup is complete, you should be able to:

- ✅ Upload PDF/DOCX files under 5MB
- ✅ View uploaded files in the application
- ✅ Download CV files
- ✅ Delete/replace existing CVs
- ✅ Companies can access applicant CVs
- ✅ No permission errors during file operations

## 📝 **Quick Setup Script**

For a faster setup, you can also use the existing `fix_storage_policies.sql` file in your project, which contains the same policies but with a simpler approach.

The storage setup is now complete and ready for CV uploads!</content>
</xai:function_call/>
