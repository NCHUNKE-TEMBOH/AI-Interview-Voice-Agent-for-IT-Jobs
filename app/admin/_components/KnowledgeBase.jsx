/**
 * Knowledge Base Component
 * Manage documents in the knowledge base
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    content: '',
    category: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/admin/documents');
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.title || !uploadData.content) return;

    setUploading(true);
    try {
      const response = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadData),
      });

      const data = await response.json();
      if (data.success) {
        setUploadData({ title: '', content: '', category: '' });
        setShowUpload(false);
        fetchDocuments();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/admin/documents?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchDocuments();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Knowledge Base</h2>
          <p className="text-slate-400">
            {documents.length} documents indexed
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>Add Document</Button>
      </div>

      {/* Upload Dialog */}
      {showUpload && (
        <Card className="p-6 bg-slate-800 border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Add New Document
          </h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-slate-300">
                Title
              </Label>
              <Input
                id="title"
                value={uploadData.title}
                onChange={(e) =>
                  setUploadData({ ...uploadData, title: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-slate-300">
                Category (optional)
              </Label>
              <Input
                id="category"
                value={uploadData.category}
                onChange={(e) =>
                  setUploadData({ ...uploadData, category: e.target.value })
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="content" className="text-slate-300">
                Content
              </Label>
              <textarea
                id="content"
                value={uploadData.content}
                onChange={(e) =>
                  setUploadData({ ...uploadData, content: e.target.value })
                }
                className="w-full h-48 p-3 bg-slate-700 border border-slate-600 rounded-md text-white"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUpload(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="text-center text-slate-400 py-8">Loading...</div>
      ) : documents.length === 0 ? (
        <Card className="p-8 bg-slate-800 border-slate-700">
          <div className="text-center text-slate-400">
            <p className="text-lg mb-2">No documents yet</p>
            <p className="text-sm">
              Add your first document to start building your knowledge base
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="p-4 bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {doc.title}
                    </h3>
                    {doc.category && (
                      <Badge variant="secondary">{doc.category}</Badge>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-3">
                    {doc.content}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    Added: {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(doc.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
