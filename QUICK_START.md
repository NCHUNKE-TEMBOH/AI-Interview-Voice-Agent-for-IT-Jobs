# Quick Start Guide

## Run the Project

Simply run this command in your terminal:

```bash
npm run dev
```

This will automatically:
1. ✅ Start the Node.js server (Next.js) on port 3000
2. ✅ Start the Python Text Extractor Service on port 8000

## Access the Admin Page

Once both services are running, open your browser and go to:

### 🌐 Admin Dashboard
```
http://localhost:3000/admin
```

### 🔐 Admin Login Credentials
```
Username: camilla
Password: camilla123
```

## Supported File Types

The admin dashboard supports uploading the following file types:
- **PDF** - PDF Documents
- **DOC** - Older Word Documents (.doc)
- **DOCX** - Word Documents (.docx)
- **TXT** - Text Files
- **MD** - Markdown Files
- **JSON** - JSON Files
- **CSV** - CSV Files

The Python service automatically:
1. Extracts text from PDF, DOC, and DOCX files
2. Chunks the text into smaller pieces
3. Generates embeddings using Gemini AI
4. Stores the embeddings in Pinecone for retrieval

## What You'll See

### Terminal Output
You'll see two services starting:
- **[0] dev:node** - Next.js development server
- **[1] dev:python** - Python text extractor service

### Browser
Navigate to `http://localhost:3000/admin` to access the admin dashboard where you can:
- Upload documents (PDF, DOCX, TXT)
- Manage your knowledge base
- View system metrics
- Chat with the RAG system
- View system logs

## Stopping the Services

Press `Ctrl+C` in the terminal to stop both services.

## Troubleshooting

If the Python service doesn't start automatically, you can run it manually:

```bash
cd python-service
start-python-service.bat
```

Then in another terminal, run the Node server:

```bash
npm run dev:node
```

## Environment Variables

Make sure your `.env` file contains the required API keys for the RAG system to work properly.
