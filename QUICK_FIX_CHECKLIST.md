# Quick Fix Checklist

## ✅ Issues Fixed in Code

### 1. **Jobs Loading Error (Multiple Foreign Keys)**
- **Fixed**: Updated jobs fetching to handle multiple foreign key relationships
- **Solution**: Tries specific foreign key names, falls back to separate queries
- **Status**: ✅ Code updated

### 2. **CV Upload RLS Error**
- **Fixed**: Better error messages and handling
- **Solution**: Clear instructions for storage setup
- **Status**: ✅ Code updated, requires manual storage setup

### 3. **Application History Foreign Keys**
- **Fixed**: Same foreign key handling as jobs
- **Solution**: Multiple fallback strategies
- **Status**: ✅ Code updated

### 4. **Company Candidates Page 404**
- **Fixed**: Created complete candidates management page
- **Solution**: Full-featured page at `/company/candidates`
- **Status**: ✅ Page created

### 5. **User Dashboard Interview Buttons**
- **Fixed**: Removed interview creation, added application focus
- **Solution**: Quick actions for applications and billing
- **Status**: ✅ Dashboard updated

---

## 🔧 Manual Setup Required

### **CRITICAL: Storage Bucket Setup**

Since you can't run storage policy SQL commands, you must set up the bucket manually:

#### **Step 1: Create Bucket (Supabase Dashboard)**
1. Go to **Storage** in Supabase Dashboard
2. Click **"Create a new bucket"**
3. Name: `cv-uploads`
4. **✅ Check "Public bucket"** (VERY IMPORTANT!)
5. File size limit: 5MB
6. Click "Create bucket"

#### **Step 2: Test CV Upload**
- Try uploading a CV in your app
- If you get "RLS policy" error, the bucket isn't public
- If you get "Bucket not found", the bucket name is wrong

---

## 🎯 What Should Work Now

### **Jobs Page**:
- ✅ Should load jobs without foreign key errors
- ✅ Falls back to separate queries if needed
- ✅ Shows company information

### **Application History**:
- ✅ Should load applications without errors
- ✅ Handles missing foreign key relationships
- ✅ Shows job and company details

### **Company Candidates**:
- ✅ Page exists at `/company/candidates`
- ✅ Shows all applicants
- ✅ CV screening functionality
- ✅ Application management

### **User Dashboard**:
- ✅ No more interview creation buttons
- ✅ Focus on job applications
- ✅ Quick actions for applications and billing

### **CV Upload** (after storage setup):
- ✅ Better error messages
- ✅ Clear instructions for fixes
- ✅ File validation and progress

---

## 🚨 If Things Still Don't Work

### **Jobs Still Not Loading**:
1. Check browser console for specific error
2. Verify Jobs and Companies tables exist
3. Check if there's data in the tables

### **CV Upload Still Failing**:
1. **Most likely**: Bucket not set to public
2. Check bucket name is exactly `cv-uploads`
3. Try recreating the bucket

### **Application History Empty**:
1. Apply for a job first to create test data
2. Check if Job_Submissions table exists
3. Verify user has applications

### **Company Candidates 404**:
1. Make sure you're logged in as a company
2. Check URL is `/company/candidates`
3. Verify company has job postings

---

## 🎉 Success Indicators

You'll know everything is working when:

### **Users Can**:
- ✅ Browse jobs on Find Jobs page
- ✅ Upload CV without errors
- ✅ Apply for jobs
- ✅ See application history
- ✅ Manage credits

### **Companies Can**:
- ✅ Login without errors
- ✅ Access candidates page
- ✅ View applicant CVs
- ✅ Screen CVs with AI
- ✅ Manage applications

---

## 📞 Next Steps

1. **Set up storage bucket** (manual, required)
2. **Test jobs loading** (should work now)
3. **Test application flow** (user applies, company sees candidate)
4. **Test CV screening** (after storage setup)

The main blocker is the storage bucket setup - once that's done, everything should work! 🚀

---

## 🔍 Debug Commands

If you need to check what's happening:

### **Check if bucket exists**:
```javascript
// Run in browser console
const { data, error } = await supabase.storage.listBuckets();
console.log('Buckets:', data);
```

### **Check foreign keys**:
```sql
-- Run in Supabase SQL Editor
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('Jobs', 'Job_Submissions')
ORDER BY tc.table_name;
```

### **Check table data**:
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) as jobs_count FROM "Jobs";
SELECT COUNT(*) as companies_count FROM "Companies";
SELECT COUNT(*) as submissions_count FROM "Job_Submissions";
```
