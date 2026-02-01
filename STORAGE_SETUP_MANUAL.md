# Manual Storage Setup for CV Uploads

Since storage policies cannot be created via SQL commands, follow these steps to set up CV upload functionality:

## Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"Create a new bucket"**
3. Set the following:
   - **Name**: `cv-uploads`
   - **Public bucket**: ✅ **Enabled** (checked)
   - **File size limit**: 5MB

## Step 2: Configure Storage Policies

After creating the bucket, you need to add policies. However, the current Supabase dashboard might not show policy options immediately. If you encounter issues:

### Alternative: Use the fix_storage_policies.sql script

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `fix_storage_policies.sql`
3. Run the script

This script will:

- Create the `cv-uploads` bucket if it doesn't exist
- Drop any existing conflicting policies
- Create permissive policies for authenticated users to:
  - Upload files to cv-uploads
  - View files in cv-uploads
  - Update files in cv-uploads
  - Delete files in cv-uploads

## Step 3: Verify Setup

After running the storage policies script, verify that:

- The `cv-uploads` bucket exists and is public
- Users can upload CV files through the application
- Companies can view applicant CVs
- File operations work without permission errors

## Troubleshooting

If you still get permission errors:

1. Check that RLS is enabled on `storage.objects` table
2. Verify the bucket name matches exactly: `cv-uploads`
3. Ensure users are authenticated before uploading
4. Check browser console for specific error messages

## File Upload Flow

The application expects:

- PDF and DOCX files only
- Maximum 5MB file size
- Files stored in user-specific folders
- Public access for company screening</content>
</xai:function_call/>
