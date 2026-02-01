# RAG System Implementation Guide

This document explains the RAG (Retrieval-Augmented Generation) system implemented for the AI Interview Voice Agent project.

## Overview

The RAG system allows administrators to upload documents to a vector database (Pinecone) and query them using AI-powered semantic search. This enables the AI to provide accurate, context-aware responses based on uploaded documentation.

## Architecture

```
┌─────────────┐
│   Admin    │
│   Panel     │
│  (Upload)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  Document Processing Pipeline                   │
│                                              │
│  1. File Upload → 2. Text Extraction      │
│     ↓              ↓                        │
│  3. Chunking → 4. Gemini Embedding       │
│     ↓              ↓                        │
│  5. Pinecone Storage                      │
└─────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  Query Pipeline                               │
│                                              │
│  1. User Query → 2. Query Embedding        │
│     ↓              ↓                        │
│  3. Pinecone Search → 4. Context Retrieval   │
│     ↓              ↓                        │
│  5. Gemini Generation → 6. Response          │
└─────────────────────────────────────────────────────┘
```

## Components

### 1. Admin Panel (`/admin`)
**Location:** [`app/admin/page.jsx`](app/admin/page.jsx:1)

Features:
- **Document Upload**: Drag-and-drop file upload with support for TXT, MD, JSON, PDF, DOCX
- **Document Management**: View, search, and delete uploaded documents
- **Database Statistics**: Real-time stats on documents, vectors, and dimensions
- **Tab Navigation**: Switch between Documents view and RAG Chat

### 2. Pinecone Service (`lib/pinecone-service.js`)
**Location:** [`lib/pinecone-service.js`](lib/pinecone-service.js:1)

Key Functions:
- `generateEmbedding(text)` - Generate 768-dimension embeddings using Gemini
- `chunkText(text, chunkSize, overlap)` - Split text into overlapping chunks
- `storeDocumentInPinecone(document)` - Store document chunks as vectors
- `queryPinecone(query, topK, filter)` - Semantic search for relevant chunks
- `deleteDocumentFromPinecone(documentId)` - Remove all chunks for a document
- `listAllDocuments()` - Get all unique documents in the index
- `getIndexStats()` - Get database statistics

### 3. Document API (`/api/admin/documents`)
**Location:** [`app/api/admin/documents/route.js`](app/api/admin/documents/route.js:1)

Endpoints:
- `GET /api/admin/documents` - List all documents with stats
- `POST /api/admin/documents` - Upload and process a new document
- `DELETE /api/admin/documents?id={id}` - Delete a document

### 4. Query API (`/api/admin/query`)
**Location:** [`app/api/admin/query/route.js`](app/api/admin/query/route.js:1)

Endpoint:
- `POST /api/admin/query` - Query the RAG system

Request Body:
```json
{
  "query": "Your question here",
  "topK": 5,
  "useRAG": true
}
```

Response:
```json
{
  "success": true,
  "query": "Your question here",
  "response": "AI-generated answer with context",
  "context": "Retrieved document chunks...",
  "sources": [
    {
      "id": "doc-id-chunk-0",
      "title": "Document Title",
      "fileName": "document.pdf",
      "score": 0.95,
      "chunkIndex": 0
    }
  ],
  "sourcesCount": 3
}
```

### 5. RAG Chat Component
**Location:** [`app/admin/_components/RAGChat.jsx`](app/admin/_components/RAGChat.jsx:1)

Features:
- Real-time chat interface
- Toggle RAG on/off
- Source citation display
- Message history
- Loading states

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @pinecone-database/pinecone
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=production
PINECONE_INDEX_NAME=ai-interview-docs
PINECONE_PROJECT_ID=your_project_id_here

# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
VAPI_PUBLIC_KEY=your_vapi_public_key
```

### 3. Create Pinecone Index

Follow the guide in [`PINECONE_SETUP_GUIDE.md`](PINECONE_SETUP_GUIDE.md:1) to:
1. Create a Pinecone account
2. Create a project
3. Create an index with:
   - **Name**: `ai-interview-docs`
   - **Dimension**: `768` (for Gemini text-embedding-004)
   - **Metric**: `cosine`
   - **Pod Type**: `s1` (free tier) or `p1` (production)

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Access the Admin Panel

Navigate to: `http://localhost:3000/admin`

## Usage

### Uploading Documents

1. Go to the **Documents** tab
2. Drag and drop a file or click to select
3. Enter a title (optional, defaults to filename)
4. Add a description (optional)
5. Click **Upload Document**

The system will:
1. Extract text from the file
2. Chunk the text into ~1000 character pieces with 200 character overlap
3. Generate embeddings for each chunk using Gemini AI
4. Store vectors in Pinecone
5. Display success message with chunk count

### Querying Documents

1. Go to the **RAG Chat** tab
2. Type your question in the input field
3. Press Enter or click Send
4. View the AI response with cited sources

The system will:
1. Generate an embedding for your query
2. Search Pinecone for similar chunks (default: top 5)
3. Build context from retrieved chunks
4. Generate response using Gemini with the context
5. Display response with source citations

### Managing Documents

- **Search**: Use the search bar to filter documents by title or filename
- **Delete**: Click the trash icon to remove a document (deletes all chunks)
- **Refresh**: Click the Refresh button to reload the document list
- **View Stats**: Check the Database Statistics card for totals

## Document Processing Details

### Chunking Strategy

- **Chunk Size**: 1000 characters
- **Overlap**: 200 characters
- **Boundary Detection**: Attempts to break at sentence endings (periods, newlines)

This ensures:
- Sufficient context for each chunk
- Smooth transitions between chunks
- No loss of information at boundaries

### Embedding Model

- **Model**: Google Gemini `text-embedding-004`
- **Dimensions**: 768
- **Purpose**: Semantic representation of text meaning

### Vector Storage

- **Database**: Pinecone
- **Index**: `ai-interview-docs`
- **Metric**: Cosine similarity
- **Metadata**: Document ID, chunk index, title, filename, content, upload date

## API Reference

### Document Upload

```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('title', 'Document Title');
formData.append('description', 'Optional description');

const response = await fetch('/api/admin/documents', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
// { success: true, document: {...}, message: "..." }
```

### Document Query

```javascript
const response = await fetch('/api/admin/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What is the interview process?',
    topK: 5,
    useRAG: true,
  }),
});

const data = await response.json();
// { success: true, response: "...", sources: [...] }
```

### Document Deletion

```javascript
const response = await fetch(`/api/admin/documents?id=${documentId}`, {
  method: 'DELETE',
});

const data = await response.json();
// { success: true, deletedCount: 5, message: "..." }
```

## Troubleshooting

### Issue: "PINECONE_API_KEY is not defined"

**Solution**: Add the environment variable to your `.env` file and restart the dev server.

### Issue: "Index not found"

**Solution**: 
1. Verify the index name in `.env` matches your Pinecone index
2. Check the index has finished provisioning in Pinecone Console
3. Ensure you're using the correct project

### Issue: "Dimension mismatch"

**Solution**: 
1. Verify your Pinecone index dimension is 768
2. Recreate the index if needed
3. Ensure you're using the correct embedding model

### Issue: "No relevant documents found"

**Solution**:
1. Upload more documents to the vector database
2. Check your query is relevant to uploaded content
3. Try rephrasing your question
4. Increase `topK` parameter to retrieve more results

### Issue: PDF/DOCX text extraction not working

**Solution**: The current implementation uses placeholder text extraction. For production:

**For PDF:**
```bash
npm install pdf-parse
```

Update [`app/api/admin/documents/route.js`](app/api/admin/documents/route.js:1):
```javascript
import pdf from 'pdf-parse';

async function extractTextFromPDF(buffer) {
  const data = await pdf(buffer);
  return data.text;
}
```

**For DOCX:**
```bash
npm install mammoth
```

Update [`app/api/admin/documents/route.js`](app/api/admin/documents/route.js:1):
```javascript
import mammoth from 'mammoth';

async function extractTextFromDOCX(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
```

## Performance Considerations

### Chunk Size
- **Smaller chunks** (500 chars): More precise retrieval, more vectors, higher cost
- **Larger chunks** (2000 chars): More context per chunk, fewer vectors, lower cost
- **Recommended**: 1000 characters with 200 overlap

### TopK Value
- **Lower** (3): Faster, more focused results
- **Higher** (10): More comprehensive, slower
- **Recommended**: 5 for most use cases

### Batch Processing
For large documents, consider:
1. Processing in batches
2. Implementing progress indicators
3. Adding retry logic for failed embeddings

## Security Considerations

1. **API Keys**: Never commit to version control
2. **Access Control**: Currently open to all authenticated users
3. **Document Privacy**: All documents are stored in the same index
4. **Rate Limiting**: Consider implementing rate limits for API calls

## Future Enhancements

Potential improvements:
1. **User-specific document isolation**: Separate indexes per user/company
2. **Advanced chunking**: Semantic chunking using sentence embeddings
3. **Hybrid search**: Combine vector search with keyword search
4. **Document versioning**: Track document updates and history
5. **Access control**: Restrict document access based on user roles
6. **Analytics**: Track query patterns and document usage
7. **Multi-modal**: Support for images, tables, and other content types

## Support

For issues or questions:
1. Check [`PINECONE_SETUP_GUIDE.md`](PINECONE_SETUP_GUIDE.md:1) for Pinecone setup
2. Review Pinecone Console for index status
3. Check browser console for error messages
4. Verify environment variables are set correctly

---

**Last Updated**: 2025-02-01
**Version**: 1.0
