"use client"
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/services/supabaseClient';
import { Upload, FileText, Trash2, Download, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CVUpload({ user, onCVUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or DOCX file only');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    await uploadCV(file);
  };

  const uploadCV = async (file) => {
    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    // Check if user has credits for CV upload (only for new uploads, not replacements)
    if (!user.cv_url) {
      const { data: canUpload, error: creditError } = await supabase
        .rpc('can_upload_cv', { user_id: user.id });

      if (creditError) {
        console.error('Error checking credits:', creditError);
        toast.error('Error checking upload permissions');
        return;
      }

      if (!canUpload) {
        toast.error('Insufficient credits for CV upload. You need at least 1 credit and can upload up to 3 times per credit package.');
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create file path with user ID
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/cv.${fileExt}`;

      // Delete existing CV if it exists
      if (user.cv_url) {
        const existingPath = user.cv_url.split('/').pop();
        await supabase.storage
          .from('cv-uploads')
          .remove([`${user.id}/${existingPath}`]);
      }

      // Upload new file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cv-uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        console.error('Full upload error:', JSON.stringify(uploadError, null, 2));

        // Provide specific error messages based on error type
        if (uploadError.message?.includes('row-level security policy')) {
          toast.error('Storage permission error. Please ensure the cv-uploads bucket is set to public in Supabase Dashboard.');
        } else if (uploadError.message?.includes('Bucket not found')) {
          toast.error('Storage bucket not found. Please create a bucket named "cv-uploads" in Supabase Dashboard.');
        } else if (uploadError.message?.includes('File size')) {
          toast.error('File too large. Please upload a file smaller than 5MB.');
        } else {
          toast.error(`Upload failed: ${uploadError.message || 'Unknown storage error'}`);
        }
        return;
      }

      setUploadProgress(50);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cv-uploads')
        .getPublicUrl(fileName);

      setUploadProgress(75);

      // Deduct credits for new CV upload (not for replacements)
      if (!user.cv_url) {
        try {
          const { data: creditDeducted, error: creditError } = await supabase
            .rpc('deduct_credits_for_cv_upload', { user_id: user.id });

          if (creditError) {
            console.error('Error deducting credits:', creditError);
            console.error('Full credit error:', JSON.stringify(creditError, null, 2));

            // If function doesn't exist, continue without credit deduction
            if (creditError.code === '42883') {
              console.log('Credit function not available, proceeding without deduction');
            } else {
              toast.error('Error processing credit deduction');
              return;
            }
          } else if (!creditDeducted) {
            toast.error('Failed to deduct credits for CV upload');
            return;
          }
        } catch (error) {
          console.error('Exception deducting credits:', error);
          // Continue without credit deduction if there's an error
          console.log('Proceeding without credit deduction due to error');
        }
      }

      // Update user record in database
      const { data: updateData, error: updateError } = await supabase
        .from('Users')
        .update({
          cv_url: urlData.publicUrl,
          cv_filename: file.name,
          cv_uploaded_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('Database update error:', updateError);
        toast.error(`Failed to update profile: ${updateError.message}`);
        return;
      }

      setUploadProgress(100);
      toast.success('CV uploaded successfully!');

      // Update parent component
      if (onCVUpdate && updateData && updateData.length > 0) {
        onCVUpdate(updateData[0]);
      }

    } catch (error) {
      console.error('Exception during upload:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteCV = async () => {
    if (!user?.cv_url) return;

    try {
      // Extract file path from URL
      const urlParts = user.cv_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('cv-uploads')
        .remove([filePath]);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        toast.error(`Failed to delete CV: ${deleteError.message}`);
        return;
      }

      // Update user record
      const { data: updateData, error: updateError } = await supabase
        .from('Users')
        .update({
          cv_url: null,
          cv_filename: null,
          cv_uploaded_at: null
        })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('Database update error:', updateError);
        toast.error(`Failed to update profile: ${updateError.message}`);
        return;
      }

      toast.success('CV deleted successfully');
      setDeleteDialogOpen(false);

      // Update parent component
      if (onCVUpdate && updateData && updateData.length > 0) {
        onCVUpdate(updateData[0]);
      }

    } catch (error) {
      console.error('Exception during delete:', error);
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const handleViewCV = () => {
    if (user?.cv_url) {
      window.open(user.cv_url, '_blank');
    }
  };

  const handleDownloadCV = () => {
    if (user?.cv_url) {
      const link = document.createElement('a');
      link.href = user.cv_url;
      link.download = user.cv_filename || 'cv.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          CV Upload
        </CardTitle>
        <CardDescription>
          Upload your CV to increase your chances of getting hired. Supported formats: PDF, DOCX (Max 5MB)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {user?.cv_url ? (
          // CV already uploaded
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-800">CV Uploaded</p>
                <p className="text-sm text-green-600">
                  {user.cv_filename} • Uploaded {new Date(user.cv_uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleViewCV}>
                <Eye className="h-4 w-4 mr-2" />
                View CV
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadCV}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Replace CV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          // No CV uploaded
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">No CV uploaded</p>
                <p className="text-sm text-blue-600">
                  Upload your CV to let employers know more about you
                </p>
              </div>
            </div>

            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload CV'}
            </Button>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete CV</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete your CV? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCV}>
                Delete CV
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
