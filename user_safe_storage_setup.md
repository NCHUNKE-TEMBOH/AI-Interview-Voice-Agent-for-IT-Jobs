# User-Safe Storage Setup Guide

Since you can't run storage policy commands directly, here's how to set up CV uploads through the Supabase Dashboard:

## 1. Create Storage Bucket (Dashboard Method)

### Step 1: Go to Storage
1. Open your Supabase project dashboard
2. Click **"Storage"** in the left sidebar
3. Click **"Create a new bucket"**

### Step 2: Configure Bucket
- **Name**: `cv-uploads`
- **Public bucket**: ✅ **Check this box** (very important!)
- **File size limit**: `5242880` (5MB in bytes)
- **Allowed MIME types**: `application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Step 3: Click "Create bucket"

## 2. Set Up Storage Policies (Dashboard Method)

### Step 1: Go to Policies
1. In Storage, click on your `cv-uploads` bucket
2. Click the **"Policies"** tab
3. Click **"Add policy"**

### Step 2: Create Upload Policy
- **Policy name**: `Allow CV uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'cv-uploads'
```

### Step 3: Create View Policy
- **Policy name**: `Allow CV viewing`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'cv-uploads'
```

### Step 4: Create Update Policy
- **Policy name**: `Allow CV updates`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'cv-uploads'
```

### Step 5: Create Delete Policy
- **Policy name**: `Allow CV deletion`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'cv-uploads'
```

## 3. Alternative: Simple Public Bucket

If the above policies don't work, you can make the bucket completely public:

### Step 1: Edit Bucket
1. Go to Storage → cv-uploads bucket
2. Click the **"Settings"** tab
3. Make sure **"Public bucket"** is enabled

### Step 2: No Policies Needed
- Public buckets don't need RLS policies
- Anyone can upload/view files (less secure but works)

## 4. Test the Setup

### Step 1: Check Bucket Exists
Run this in your browser console on your app:
```javascript
// Test if bucket is accessible
const { data, error } = await supabase.storage.listBuckets();
console.log('Buckets:', data);
console.log('Error:', error);
```

### Step 2: Test Upload
Try uploading a CV through your app. If you get errors, check:
1. Bucket is public
2. File size is under 5MB
3. File type is PDF or DOCX

## 5. Troubleshooting

### Error: "new row violates row-level security policy"
**Solution**: Make sure the bucket is set to **public** in the dashboard

### Error: "Bucket not found"
**Solution**: 
1. Check bucket name is exactly `cv-uploads`
2. Recreate the bucket if needed

### Error: "File too large"
**Solution**: 
1. Check file is under 5MB
2. Increase bucket file size limit in settings

### Error: "Invalid file type"
**Solution**: 
1. Only upload PDF or DOCX files
2. Check MIME types in bucket settings

## 6. Manual Bucket Creation (If Dashboard Fails)

If you can't create the bucket through the dashboard, you can try this minimal SQL:

```sql
-- Only run this if you have permission
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', true)
ON CONFLICT (id) DO NOTHING;
```

## 7. Verify Setup

Once the bucket is created, your CV upload should work. You'll know it's working when:

1. ✅ No "RLS policy" errors when uploading
2. ✅ Files appear in the Storage dashboard
3. ✅ You can view/download uploaded CVs
4. ✅ File URLs are accessible

## 8. Security Notes

### Public Bucket Implications:
- **Pros**: Easy to set up, no policy issues
- **Cons**: Anyone with the URL can access files
- **Recommendation**: Use for testing, implement proper policies later

### Proper Security (Future):
- User-specific folders: `{user_id}/cv.pdf`
- RLS policies based on user authentication
- File access logging
- Automatic file cleanup

## 9. Next Steps

Once CV upload is working:
1. Test job applications
2. Test application history
3. Test company candidate management
4. Verify credit system

The storage setup is the main blocker for CV functionality - once this works, everything else should function properly!
