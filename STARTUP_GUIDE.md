 # AI Interview Voice Agent - Startup Guide

## Quick Start

### 1. Install Node.js Dependencies
```bash
npm install
```

### 2. Run the Project
```bash
npm run dev
```

This command will:
- Start the Next.js Node.js server on port 3000
- Start the Python Text Extractor Service on port 8000

### 3. Access the Admin Page
Once both services are running, open your browser and navigate to:
```
http://localhost:3000/admin
```

### 4. Login to Admin Dashboard
Use the following credentials to access the admin dashboard:
```
Username: camilla
Password: camilla123
```

## Services Overview

### Node.js Server (Next.js)
- **Port**: 3000
- **Purpose**: Main web application and API routes
- **Status**: You'll see "Ready in X ms" when ready

### Python Text Extractor Service
- **Port**: 8000
- **Purpose**: PDF/DOCX text extraction and RAG system
- **Status**: You'll see "Starting RAG Python Service on 0.0.0.0:8000" when ready

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

### Missing Dependencies
If you see errors about missing packages:
```bash
npm install
```

## Environment Variables
Make sure your `.env` file contains the required API keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `PINECONE_API_KEY`

## Admin Dashboard Features
- Upload documents (PDF, DOCX, TXT)
- Manage knowledge base
- View system metrics
- Chat with RAG system
- View system logs

## Stopping the Services
Press `Ctrl+C` in the terminal to stop both services.
