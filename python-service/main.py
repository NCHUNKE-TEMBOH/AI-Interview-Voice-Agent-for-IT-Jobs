"""
Python Backend Service for RAG System
Provides PDF text extraction and embedding generation using Python
"""

import os
import base64
import io
import secrets
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# PDF Processing
import PyPDF2
import pdfplumber

# DOCX Processing
from docx import Document
import warnings

# AI/ML
import google.generativeai as genai
from pinecone import Pinecone, ServerlessSpec

# HTTP Client
import httpx

# Load environment variables
load_dotenv()

# ==================== Configuration ====================

class Settings(BaseSettings):
    """Application settings"""
    # Auth
    ADMIN_USERNAME: str = "camilla"
    ADMIN_PASSWORD: str = "camilla123"
    
    # Pinecone
    PINECONE_API_KEY: str = Field(default="", env="PINECONE_API_KEY")
    PINECONE_ENVIRONMENT: str = Field(default="production", env="PINECONE_ENVIRONMENT")
    PINECONE_INDEX_NAME: str = Field(default="ai-interview-docs", env="PINECONE_INDEX_NAME")
    PINECONE_PROJECT_ID: str = Field(default="", env="PINECONE_PROJECT_ID")
    
    # Gemini
    GEMINI_API_KEY: str = Field(default="", env="GEMINI_API_KEY")
    
    # Server
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")

settings = Settings()

# ==================== FastAPI App ====================

app = FastAPI(title="RAG Python Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Authentication ====================

security = HTTPBasic()

def get_current_user(credentials: HTTPBasicCredentials = Depends(security)):
    """Simple authentication check"""
    correct_username = secrets.compare_digest(credentials.username, settings.ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, settings.ADMIN_PASSWORD)
    
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# ==================== Pydantic Models ====================

class DocumentUpload(BaseModel):
    """Document upload request"""
    file_content: str = Field(..., description="Base64 encoded file content")
    file_name: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="File extension (pdf, docx, txt, etc.)")
    title: str = Field(..., description="Document title")
    description: Optional[str] = Field(None, description="Document description")

class EmbeddingRequest(BaseModel):
    """Embedding generation request"""
    text: str = Field(..., description="Text to embed")

class ChunkingRequest(BaseModel):
    """Text chunking request"""
    text: str = Field(..., description="Text to chunk")
    chunk_size: int = Field(default=1000, description="Characters per chunk")
    overlap: int = Field(default=200, description="Character overlap between chunks")

class QueryRequest(BaseModel):
    """RAG query request"""
    query: str = Field(..., description="User query")
    top_k: int = Field(default=5, description="Number of results to return")

class EmbeddingResponse(BaseModel):
    """Embedding response"""
    embedding: List[float] = Field(..., description="768-dimension embedding vector")
    dimension: int = Field(default=768, description="Embedding dimension")

class ChunkingResponse(BaseModel):
    """Chunking response"""
    chunks: List[str] = Field(..., description="Text chunks")
    count: int = Field(..., description="Number of chunks")

class DocumentInfo(BaseModel):
    """Document information"""
    id: str = Field(..., description="Document ID")
    title: str = Field(..., description="Document title")
    file_name: str = Field(..., description="Original filename")
    file_type: str = Field(..., description="File type")
    chunk_count: int = Field(..., description="Number of chunks")
    text_length: int = Field(..., description="Total text length")

class QueryResult(BaseModel):
    """Query result"""
    id: str = Field(..., description="Vector ID")
    score: float = Field(..., description="Similarity score")
    content: str = Field(..., description="Chunk content")
    title: str = Field(..., description="Document title")
    file_name: str = Field(..., description="Source filename")
    chunk_index: int = Field(..., description="Chunk index")

class QueryResponse(BaseModel):
    """Query response"""
    results: List[QueryResult] = Field(..., description="Matching chunks")
    count: int = Field(..., description="Number of results")

# ==================== Pinecone Client ====================

def get_pinecone_client():
    """Get or create Pinecone client"""
    if not settings.PINECONE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PINECONE_API_KEY not configured"
        )
    
    return Pinecone(api_key=settings.PINECONE_API_KEY)

def get_pinecone_index():
    """Get Pinecone index"""
    client = get_pinecone_client()
    return client.Index(settings.PINECONE_INDEX_NAME)

# ==================== Gemini Client ====================

def configure_gemini():
    """Configure Gemini API key"""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY not configured"
        )
    
    genai.configure(api_key=settings.GEMINI_API_KEY)

# ==================== Text Extraction ====================

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF using PyPDF2 and pdfplumber"""
    text = ""
    
    try:
        # Try PyPDF2 first
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        if text.strip():
            return text
    except Exception as e:
        print(f"PyPDF2 extraction failed: {e}")
    
    try:
        # Fallback to pdfplumber
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        
        if text.strip():
            return text
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}")
    
    raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract text from PDF"
        )

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc = Document(io.BytesIO(file_content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except Exception as e:
        print(f"DOCX extraction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract text from DOCX: {str(e)}"
        )

def extract_text_from_txt(file_content: bytes) -> str:
    """Extract text from TXT file"""
    try:
        return file_content.decode('utf-8')
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to decode text file: {str(e)}"
        )

def extract_text_from_file(file_content: bytes, file_type: str) -> str:
    """Extract text based on file type"""
    file_type = file_type.lower()
    
    if file_type == 'pdf':
        return extract_text_from_pdf(file_content)
    elif file_type in ['doc', 'docx']:
        # Use python-docx for both .doc and .docx files
        try:
            doc = Document(io.BytesIO(file_content))
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except Exception as e:
            print(f"DOC/DOCX extraction failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to extract text from DOC/DOCX: {str(e)}"
            )
    elif file_type in ['txt', 'md', 'json', 'csv']:
        return extract_text_from_txt(file_content)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file_type}"
        )

# ==================== Chunking ====================

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Chunk text into overlapping pieces"""
    if not text or len(text) == 0:
        return []
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # Try to break at sentence boundary
        if end < len(text):
            last_period = text.rfind('.', start, end)
            last_newline = text.rfind('\n', start, end)
            last_break = max(last_period, last_newline)
            
            if last_break > start + chunk_size // 2:
                end = last_break + 1
        
        chunks.append(text[start:end])
        start = end - overlap
    
    return chunks

# ==================== Embeddings ====================

def generate_embedding(text: str) -> List[float]:
    """Generate embedding using Gemini AI"""
    try:
        configure_gemini()
        model = 'models/embedding-001'
        
        result = genai.embed_content(
            model=model,
            content=text,
            task_type="retrieval_document"
        )
        
        embedding = result['embedding']
        return embedding
    except Exception as e:
        print(f"Embedding generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate embedding: {str(e)}"
        )

def generate_batch_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for multiple texts"""
    embeddings = []
    for text in texts:
        embedding = generate_embedding(text)
        embeddings.append(embedding)
    return embeddings

# ==================== Pinecone Operations ====================

def store_document_in_pinecone(
    document_id: str,
    title: str,
    file_name: str,
    file_type: str,
    chunks: List[str],
    embeddings: List[List[float]]
) -> Dict[str, Any]:
    """Store document chunks in Pinecone"""
    try:
        index = get_pinecone_index()
        
        # Prepare vectors
        vectors = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            vectors.append({
                "id": f"{document_id}-chunk-{i}",
                "values": embedding,
                "metadata": {
                    "documentId": document_id,
                    "chunkIndex": i,
                    "title": title,
                    "fileName": file_name,
                    "fileType": file_type,
                    "content": chunk,
                    "totalChunks": len(chunks),
                    "uploadedAt": __import__('datetime').datetime.utcnow().isoformat(),
                }
            })
        
        # Upsert vectors
        index.upsert(vectors=vectors, namespace="documents")
        
        return {
            "success": True,
            "documentId": document_id,
            "chunksStored": len(vectors),
            "message": f"Document stored successfully with {len(vectors)} chunks"
        }
    except Exception as e:
        print(f"Pinecone storage failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store in Pinecone: {str(e)}"
        )

def query_pinecone(query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
    """Query Pinecone for similar vectors"""
    try:
        index = get_pinecone_index()
        
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True,
            namespace="documents"
        )
        
        formatted_results = []
        for match in results.matches:
            formatted_results.append({
                "id": match.id,
                "score": match.score,
                "content": match.metadata.get("content", ""),
                "title": match.metadata.get("title", ""),
                "fileName": match.metadata.get("fileName", ""),
                "chunkIndex": match.metadata.get("chunkIndex", 0),
            })
        
        return formatted_results
    except Exception as e:
        print(f"Pinecone query failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query Pinecone: {str(e)}"
        )

def delete_document_from_pinecone(document_id: str) -> Dict[str, Any]:
    """Delete all chunks for a document from Pinecone"""
    try:
        index = get_pinecone_index()
        
        # Query to find all chunks for this document
        results = index.query(
            vector=[0.0] * 768,  # Dummy vector for filtering
            top_k=10000,
            include_metadata=True,
            filter={"documentId": {"$eq": document_id}},
            namespace="documents"
        )
        
        if results.matches:
            ids_to_delete = [match.id for match in results.matches]
            index.delete(ids=ids_to_delete, namespace="documents")
            
            return {
                "success": True,
                "deletedCount": len(ids_to_delete),
                "message": f"Deleted {len(ids_to_delete)} chunks successfully"
            }
        else:
            return {
                "success": True,
                "deletedCount": 0,
                "message": "No chunks found for this document"
            }
    except Exception as e:
        print(f"Pinecone deletion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete from Pinecone: {str(e)}"
        )

# ==================== API Endpoints ====================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "RAG Python Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "pinecone_configured": bool(settings.PINECONE_API_KEY),
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }

@app.get("/documents")
async def list_documents(user: str = Depends(get_current_user)):
    """List all documents from Pinecone"""
    try:
        index = get_pinecone_index()
        
        # Query to get all documents (using a dummy vector)
        results = index.query(
            vector=[0.0] * 768,
            top_k=10000,
            include_metadata=True,
            namespace="documents"
        )
        
        # Group by document ID to get unique documents
        documents = {}
        for match in results.matches:
            doc_id = match.metadata.get("documentId")
            if doc_id and doc_id not in documents:
                documents[doc_id] = {
                    "id": doc_id,
                    "title": match.metadata.get("title", ""),
                    "fileName": match.metadata.get("fileName", ""),
                    "fileType": match.metadata.get("fileType", ""),
                    "chunkCount": match.metadata.get("totalChunks", 0),
                    "uploadedAt": match.metadata.get("uploadedAt", ""),
                    "created_at": match.metadata.get("uploadedAt", "")
                }
        
        return {
            "success": True,
            "documents": list(documents.values()),
            "total": len(documents)
        }
    except Exception as e:
        print(f"Failed to list documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}"
        )

@app.post("/extract-text")
async def extract_text(request: DocumentUpload, user: str = Depends(get_current_user)):
    """Extract text from uploaded file"""
    try:
        # Decode base64 content
        file_content = base64.b64decode(request.file_content)
        
        # Extract text based on file type
        text = extract_text_from_file(file_content, request.file_type)
        
        return {
            "success": True,
            "text": text,
            "length": len(text),
            "fileName": request.file_name,
            "fileType": request.file_type
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text extraction failed: {str(e)}"
        )

@app.post("/chunk-text")
async def chunk_text_endpoint(request: ChunkingRequest, user: str = Depends(get_current_user)):
    """Chunk text into pieces"""
    try:
        chunks = chunk_text(request.text, request.chunk_size, request.overlap)
        
        return ChunkingResponse(
            chunks=chunks,
            count=len(chunks)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chunking failed: {str(e)}"
        )

@app.post("/generate-embedding")
async def generate_embedding_endpoint(request: EmbeddingRequest, user: str = Depends(get_current_user)):
    """Generate embedding for text"""
    try:
        embedding = generate_embedding(request.text)
        
        return EmbeddingResponse(
            embedding=embedding,
            dimension=len(embedding)
        )
    except HTTPException as e:
        raise e

@app.post("/store-document")
async def store_document(request: DocumentUpload, user: str = Depends(get_current_user)):
    """Extract text, chunk, embed, and store document"""
    try:
        # Decode base64 content
        file_content = base64.b64decode(request.file_content)
        
        # Extract text
        text = extract_text_from_file(file_content, request.file_type)
        
        if not text or len(text.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text content found in file"
            )
        
        # Chunk text
        chunks = chunk_text(text, 1000, 200)
        
        # Generate embeddings
        embeddings = generate_batch_embeddings(chunks)
        
        # Generate document ID
        import uuid
        document_id = str(uuid.uuid4())
        
        # Store in Pinecone
        result = store_document_in_pinecone(
            document_id=document_id,
            title=request.title,
            file_name=request.file_name,
            file_type=request.file_type,
            chunks=chunks,
            embeddings=embeddings
        )
        
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document storage failed: {str(e)}"
        )

@app.post("/query")
async def query_endpoint(request: QueryRequest, user: str = Depends(get_current_user)):
    """Query Pinecone for similar documents"""
    try:
        # Generate embedding for query
        query_embedding = generate_embedding(request.query)
        
        # Query Pinecone
        results = query_pinecone(query_embedding, request.top_k)
        
        return QueryResponse(
            results=results,
            count=len(results)
        )
    except HTTPException as e:
        raise e

@app.delete("/document/{document_id}")
async def delete_document(document_id: str, user: str = Depends(get_current_user)):
    """Delete a document from Pinecone"""
    try:
        result = delete_document_from_pinecone(document_id)
        return result
    except HTTPException as e:
        raise e

# ==================== Main ====================

if __name__ == "__main__":
    import uvicorn
    
    print(f"Starting RAG Python Service on {settings.HOST}:{settings.PORT}")
    print(f"Admin credentials: {settings.ADMIN_USERNAME}")
    print(f"Pinecone configured: {bool(settings.PINECONE_API_KEY)}")
    print(f"Gemini configured: {bool(settings.GEMINI_API_KEY)}")
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        log_level="info"
    )
