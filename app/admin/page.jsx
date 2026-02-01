/**
 * Admin Dashboard Page
 * Document Management Interface with Authentication
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, FileText, Upload, Trash2, CheckCircle, AlertCircle, FileUp, X } from 'lucide-react';

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'camilla',
  password: 'camilla123'
};

// Supported file types
const SUPPORTED_FILE_TYPES = {
  pdf: 'PDF Document',
  docx: 'Word Document (.docx)',
  doc: 'Word Document (.doc)',
  txt: 'Text File',
  md: 'Markdown File',
  json: 'JSON File',
  csv: 'CSV File'
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null,
  });

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === ADMIN_CREDENTIALS.username && 
        loginForm.password === ADMIN_CREDENTIALS.password) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  // Fetch documents on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isAuthenticated]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/documents');
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents || []);
      } else {
        setError(data.error || 'Failed to fetch documents');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleRemoveFile = () => {
    setUploadForm({ ...uploadForm, file: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result.split(',')[1];
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert file to base64
      const fileContent = await fileToBase64(uploadForm.file);
      
      // Get file type from extension
      const fileType = uploadForm.file.name.split('.').pop().toLowerCase();

      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent,
          fileName: uploadForm.file.name,
          fileType,
          title: uploadForm.title || uploadForm.file.name,
          description: uploadForm.description,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Document uploaded successfully');
        setUploadForm({ title: '', description: '', file: null });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchDocuments();
      } else {
        setError(data.error || 'Failed to upload document');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/documents?id=${documentId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Document deleted successfully');
        fetchDocuments();
      } else {
        setError(data.error || 'Failed to delete document');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>
              {loginError && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{loginError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Document Management System</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsAuthenticated(false)}
            className="border-gray-300 hover:bg-gray-50"
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Error/Success Messages */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 max-w-2xl mx-auto">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Upload Form */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <CardTitle>Upload Document</CardTitle>
              </div>
              <CardDescription>
                Add documents to your knowledge base (PDF, DOC, DOCX, TXT, MD, JSON, CSV)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="Document title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Document description"
                  />
                </div>
                
                {/* Drag and Drop Area */}
                <div className="space-y-2">
                  <Label>File</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.md,.json,.csv"
                      className="hidden"
                    />
                    
                    {uploadForm.file ? (
                      <div className="space-y-2">
                        <FileUp className="h-12 w-12 text-blue-600 mx-auto" />
                        <p className="text-sm font-medium text-gray-900">{uploadForm.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(uploadForm.file.size / 1024).toFixed(2)} KB
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile();
                          }}
                          className="mt-2"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FileUp className="h-12 w-12 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">
                          Drag and drop your file here, or click to browse
                        </p>
                        <p className="text-xs text-gray-400">
                          Supports: PDF, DOC, DOCX, TXT, MD, JSON, CSV
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button type="submit" disabled={uploading} className="w-full bg-blue-600 hover:bg-blue-700">
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <CardTitle>Documents</CardTitle>
              </div>
              <CardDescription>
                Manage your knowledge base documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading...</div>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500">No documents found</p>
                  <p className="text-sm text-gray-400 mt-1">Upload your first document to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                        {doc.description && (
                          <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {doc.file_type}
                          </Badge>
                          <Badge variant="outline" className="border-gray-300">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        className="ml-4"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
