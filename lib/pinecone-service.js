import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Pinecone client
let pinecone = null;

function getPineconeClient() {
  if (!pinecone) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not defined in environment variables');
    }
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pinecone;
}

// Initialize Gemini AI for embeddings
let genAI = null;

function getGeminiClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Get the Pinecone index
 */
export function getPineconeIndex() {
  const client = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX_NAME || 'ai-interview-docs';
  return client.index(indexName);
}

/**
 * Generate embeddings using Google Gemini
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
export async function generateEmbedding(text) {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent(text);
    const embedding = result.embedding.values;

    console.log(`Generated embedding for text (length: ${text.length}): ${embedding.length} dimensions`);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function generateBatchEmbeddings(texts) {
  try {
    const embeddings = [];
    for (const text of texts) {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
    }
    return embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
}

/**
 * Chunk text into smaller pieces for embedding
 * @param {string} text - Text to chunk
 * @param {number} chunkSize - Maximum characters per chunk (default: 1000)
 * @param {number} overlap - Overlap between chunks in characters (default: 200)
 * @returns {string[]} - Array of text chunks
 */
export function chunkText(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.length === 0) {
    return [];
  }

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const lastBreak = Math.max(lastPeriod, lastNewline);

      if (lastBreak > start + chunkSize / 2) {
        end = lastBreak + 1;
      }
    }

    chunks.push(text.slice(start, end));
    start = end - overlap;
  }

  console.log(`Chunked text into ${chunks.length} chunks`);
  return chunks;
}

/**
 * Store document chunks in Pinecone
 * @param {Object} document - Document metadata and content
 * @param {string} document.id - Unique document ID
 * @param {string} document.title - Document title
 * @param {string} document.content - Document content
 * @param {string} document.fileName - Original filename
 * @param {string} document.fileType - File type (pdf, txt, etc.)
 * @returns {Promise<Object>} - Result with stored vectors count
 */
export async function storeDocumentInPinecone(document) {
  try {
    const index = getPineconeIndex();

    // Chunk the document content
    const chunks = chunkText(document.content, 1000, 200);

    if (chunks.length === 0) {
      throw new Error('No content to store');
    }

    // Generate embeddings for all chunks
    console.log(`Generating embeddings for ${chunks.length} chunks...`);
    const embeddings = await generateBatchEmbeddings(chunks);

    // Prepare vectors for upsert
    const vectors = chunks.map((chunk, i) => ({
      id: `${document.id}-chunk-${i}`,
      values: embeddings[i],
      metadata: {
        documentId: document.id,
        chunkIndex: i,
        title: document.title,
        fileName: document.fileName,
        fileType: document.fileType,
        content: chunk,
        totalChunks: chunks.length,
        uploadedAt: new Date().toISOString(),
      },
    }));

    // Upsert vectors to Pinecone
    console.log(`Upserting ${vectors.length} vectors to Pinecone...`);
    await index.upsert(vectors);

    console.log(`✅ Successfully stored ${vectors.length} vectors for document: ${document.title}`);

    return {
      success: true,
      documentId: document.id,
      chunksStored: vectors.length,
      message: `Document stored successfully with ${vectors.length} chunks`,
    };
  } catch (error) {
    console.error('Error storing document in Pinecone:', error);
    throw new Error(`Failed to store document: ${error.message}`);
  }
}

/**
 * Query Pinecone for similar documents
 * @param {string} query - Query text
 * @param {number} topK - Number of results to return (default: 5)
 * @param {Object} filter - Optional metadata filter
 * @returns {Promise<Array>} - Array of matching chunks with scores
 */
export async function queryPinecone(query, topK = 5, filter = {}) {
  try {
    const index = getPineconeIndex();

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Query Pinecone
    const results = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      includeValues: false,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    console.log(`Found ${results.matches.length} matches for query`);

    return results.matches.map((match) => ({
      id: match.id,
      score: match.score,
      content: match.metadata?.content || '',
      title: match.metadata?.title || '',
      fileName: match.metadata?.fileName || '',
      documentId: match.metadata?.documentId || '',
      chunkIndex: match.metadata?.chunkIndex || 0,
      totalChunks: match.metadata?.totalChunks || 1,
      uploadedAt: match.metadata?.uploadedAt || '',
    }));
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    throw new Error(`Failed to query Pinecone: ${error.message}`);
  }
}

/**
 * Delete a document from Pinecone
 * @param {string} documentId - Document ID to delete
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteDocumentFromPinecone(documentId) {
  try {
    const index = getPineconeIndex();

    // Query to find all chunks for this document
    const results = await index.query({
      vector: Array(768).fill(0), // Dummy vector for filtering
      topK: 10000,
      includeMetadata: true,
      filter: {
        documentId: { $eq: documentId },
      },
    });

    if (results.matches.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        message: 'No chunks found for this document',
      };
    }

    // Delete all chunks
    const idsToDelete = results.matches.map((match) => match.id);
    await index.deleteMany(idsToDelete);

    console.log(`✅ Deleted ${idsToDelete.length} chunks for document: ${documentId}`);

    return {
      success: true,
      deletedCount: idsToDelete.length,
      message: `Deleted ${idsToDelete.length} chunks successfully`,
    };
  } catch (error) {
    console.error('Error deleting document from Pinecone:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

/**
 * Get index statistics
 * @returns {Promise<Object>} - Index stats
 */
export async function getIndexStats() {
  try {
    const index = getPineconeIndex();
    const stats = await index.describeIndexStats();
    return stats;
  } catch (error) {
    console.error('Error getting index stats:', error);
    throw new Error(`Failed to get index stats: ${error.message}`);
  }
}

/**
 * List all documents in the index
 * @returns {Promise<Array>} - Array of unique documents
 */
export async function listAllDocuments() {
  try {
    const index = getPineconeIndex();

    // Query with a dummy vector to get all results
    const results = await index.query({
      vector: Array(768).fill(0),
      topK: 10000,
      includeMetadata: true,
    });

    // Group by document ID to get unique documents
    const documentsMap = new Map();

    for (const match of results.matches) {
      const docId = match.metadata?.documentId;
      if (docId && !documentsMap.has(docId)) {
        documentsMap.set(docId, {
          id: docId,
          title: match.metadata?.title || '',
          fileName: match.metadata?.fileName || '',
          fileType: match.metadata?.fileType || '',
          totalChunks: match.metadata?.totalChunks || 1,
          uploadedAt: match.metadata?.uploadedAt || '',
        });
      }
    }

    return Array.from(documentsMap.values());
  } catch (error) {
    console.error('Error listing documents:', error);
    throw new Error(`Failed to list documents: ${error.message}`);
  }
}
