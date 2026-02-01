# Connection Error Fix

## Issue
The error `ECONNREFUSED` means the Node.js server cannot connect to the Python service on port 8000.

## Solution

### Step 1: Check if Python Service is Running

Look at the terminal output. You should see:
```
[dev:python] Starting RAG Python Service on 0.0.0.0:8000
[dev:python] Admin credentials: camilla
[dev:python] Pinecone configured: True
[dev:python] Gemini configured: True
```

If you don't see this, the Python service is not running.

### Step 2: Restart Both Services

1. Stop the running services by pressing `Ctrl+C` in the terminal
2. Run `npm run dev` again to restart both services

### Step 3: Verify Python Service is Running

After starting, open a new browser tab and go to:
```
http://localhost:8000
```

You should see:
```json
{
  "service": "RAG Python Service",
  "version": "1.0.0",
  "status": "running"
}
```

### Step 4: Verify Health Check

Open a browser tab and go to:
```
http://localhost:8000/health
```

You should see:
```json
{
  "status": "healthy",
  "pinecone_configured": true,
  "gemini_configured": true
}
```

## Troubleshooting

### If Python Service Won't Start

1. Navigate to the python-service directory:
   ```bash
   cd python-service
   ```

2. Manually start the Python service:
   ```bash
   python main.py
   ```

3. In a new terminal, start the Node.js server:
   ```bash
   npm run dev:node
   ```

### If Port 8000 is Already in Use

1. Find the process using port 8000:
   ```bash
   netstat -ano | findstr :8000
   ```

2. Kill the process:
   ```bash
   taskkill /PID <PID> /F
   ```

3. Restart the services with `npm run dev`

## What Should Happen

When both services are running correctly:
1. Node.js server runs on port 3000
2. Python service runs on port 8000
3. Admin page at `http://localhost:3000/admin` works
4. File uploads work with PDF, DOC, DOCX, TXT, MD, JSON, CSV
5. Text is extracted from files
6. Embeddings are generated using Gemini AI
7. Documents are stored in Pinecone
