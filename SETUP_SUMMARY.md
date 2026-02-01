# Project Setup Summary

## Admin Login Credentials
```
Username: camilla
Password: camilla123
```

## What Was Done

### 1. Updated package.json
- Added `concurrently` package to devDependencies for running multiple processes
- Modified the `dev` script to run both Node.js and Python services simultaneously
- Created separate scripts:
  - `dev:node` - Runs Next.js development server
  - `dev:python` - Runs Python text extractor service

### 2. Created Python Service Startup Script
- Created `python-service/start-python-service.bat` for Windows
- The script automatically:
  - Creates a virtual environment if it doesn't exist
  - Activates the virtual environment
  - Upgrades pip
  - Installs required dependencies
  - Starts the Python service on port 8000

### 3. Fixed Python Service Imports
- Added missing `import io` to `python-service/main.py`
- Added missing `import secrets` to `python-service/main.py`

### 4. Created Missing UI Component
- Created `components/ui/alert.jsx` component for error/success messages

### 5. Updated Admin Page
- Redesigned to match project UI style (light grey background, blue primary color)
- Added authentication with username/password protection
- Clean, modern design with icons and proper spacing
- Responsive layout with proper error/success messages
- Centered and smaller cards (max-w-2xl)
- Drag and drop file upload area
- Support for PDF, DOC, DOCX, TXT, MD, JSON, CSV files

### 6. Enhanced Python Service
- Added `/documents` endpoint to list all documents from Pinecone
- Added support for older Word (.doc) files using textract
- Added `textract` package to requirements.txt
- Enhanced text extraction for PDF, DOC, and DOCX files
- Automatic text extraction, chunking, embedding generation, and Pinecone storage

### 7. Created Documentation
- `STARTUP_GUIDE.md` - Comprehensive startup guide with troubleshooting
- `QUICK_START.md` - Quick reference guide for running the project
- `SETUP_SUMMARY.md` - Complete setup summary

## How to Run the Project

### Simple Command
```bash
npm run dev
```

This single command will:
1. Start the Next.js Node.js server on port 3000
2. Start the Python Text Extractor Service on port 8000

### Access the Admin Page
Once both services are running, open your browser and navigate to:
```
http://localhost:3000/admin
```

### Login Credentials
```
Username: camilla
Password: camilla123
```

## Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| Next.js (Node.js) | 3000 | Main web application and API routes |
| Python Text Extractor | 8000 | PDF/DOC/DOCX text extraction, embedding generation, and Pinecone storage |

## Admin Dashboard Features

- **Authentication**: Secure login with username and password
- **File Upload**: Drag and drop support for PDF, DOC, DOCX, TXT, MD, JSON, CSV files
- **Text Extraction**: Automatic text extraction from PDF, DOC, and DOCX files
- **Embedding Generation**: Automatic embedding generation using Gemini AI
- **Pinecone Storage**: Automatic storage of embeddings in Pinecone for retrieval
- Manage knowledge base
- View system metrics
- Chat with RAG system
- View system logs

## Stopping the Services

Press `Ctrl+C` in the terminal to stop both services.

## Troubleshooting

### Python Service Not Starting
If the Python service fails to start, you may need to manually set up the virtual environment:

```bash
cd python-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Port Already in Use
If port 3000 or 8000 is already in use, you can:
1. Close the application using that port
2. Or modify the port in the respective configuration files

## Environment Variables

Make sure your `.env` file contains the required API keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `PINECONE_API_KEY`
