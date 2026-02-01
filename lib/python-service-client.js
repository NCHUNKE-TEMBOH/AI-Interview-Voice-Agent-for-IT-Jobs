/**
 * Python Service Client
 * Handles communication with the Python backend service
 */

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// Simple authentication (matches Python service)
const AUTH_CREDENTIALS = {
  username: 'camilla',
  password: 'camilla123',
};

/**
 * Get basic auth headers
 */
function getAuthHeaders() {
  const credentials = btoa(`${AUTH_CREDENTIALS.username}:${AUTH_CREDENTIALS.password}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Extract text from file using Python service
 * @param {File} file - File object
 * @returns {Promise<Object>} - Extracted text
 */
export async function extractTextFromFile(file) {
  try {
    // Convert file to base64
    const fileContent = await fileToBase64(file);
    const fileType = file.name.split('.').pop().toLowerCase();

    const response = await fetch(`${PYTHON_SERVICE_URL}/extract-text`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        file_content: fileContent,
        file_name: file.name,
        file_type: fileType,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.detail || 'Failed to extract text from file');
    }

    return {
      text: data.text,
      length: data.length,
      fileName: data.fileName,
      fileType: data.fileType,
    };
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

/**
 * Store document in Pinecone via Python service
 * @param {Object} document - Document object with text and metadata
 * @returns {Promise<Object>} - Storage result
 */
export async function storeDocumentInPineconeViaPython(document) {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/store-document`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        file_content: document.fileContent,
        file_name: document.fileName,
        file_type: document.fileType,
        title: document.title,
        description: document.description,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.detail || 'Failed to store document');
    }

    return {
      success: true,
      documentId: data.documentId,
      chunksStored: data.chunksStored,
      message: data.message,
    };
  } catch (error) {
    console.error('Error storing document via Python:', error);
    throw new Error(`Document storage failed: ${error.message}`);
  }
}

/**
 * Query Pinecone via Python service
 * @param {string} query - Query text
 * @param {number} topK - Number of results
 * @returns {Promise<Object>} - Query results
 */
export async function queryPineconeViaPython(query, topK = 5) {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/query`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        query,
        top_k: topK,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.detail || 'Failed to query Pinecone');
    }

    return {
      results: data.results,
      count: data.count,
    };
  } catch (error) {
    console.error('Error querying Pinecone via Python:', error);
    throw new Error(`Query failed: ${error.message}`);
  }
}

/**
 * Delete document from Pinecone via Python service
 * @param {string} documentId - Document ID to delete
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteDocumentFromPineconeViaPython(documentId) {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/document/${documentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.detail || 'Failed to delete document');
    }

    return {
      success: true,
      deletedCount: data.deletedCount,
      message: data.message,
    };
  } catch (error) {
    console.error('Error deleting document via Python:', error);
    throw new Error(`Deletion failed: ${error.message}`);
  }
}

/**
 * List all documents via Python service
 * @returns {Promise<Object>} - List of documents
 */
export async function listDocumentsViaPython() {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/documents`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.detail || 'Failed to list documents');
    }

    return {
      documents: data.documents,
      total: data.total,
    };
  } catch (error) {
    console.error('Error listing documents via Python:', error);
    throw new Error(`List documents failed: ${error.message}`);
  }
}

/**
 * Get index stats via Python service
 * @returns {Promise<Object>} - Index statistics
 */
export async function getIndexStatsViaPython() {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.detail || 'Failed to get stats');
    }

    return {
      totalVectors: data.totalVectors,
      dimension: data.dimension,
    };
  } catch (error) {
    console.error('Error getting stats via Python:', error);
    throw new Error(`Get stats failed: ${error.message}`);
  }
}

/**
 * Helper function to convert file to base64
 * @param {File} file - File object
 * @returns {Promise<string>} - Base64 encoded string
 */
function fileToBase64(file) {
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
}

/**
 * Health check for Python service
 * @returns {Promise<boolean>} - Service health status
 */
export async function checkPythonServiceHealth() {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Python service health check failed:', error);
    return false;
  }
}
