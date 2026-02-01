/**
 * Admin Documents API Route
 * Handles document storage and retrieval using Python service
 */

import { NextResponse } from 'next/server';
import {
  storeDocumentInPineconeViaPython,
  listDocumentsViaPython,
  deleteDocumentFromPineconeViaPython,
} from '@/lib/python-service-client';

/**
 * GET /api/admin/documents
 * List all documents
 */
export async function GET() {
  try {
    const result = await listDocumentsViaPython();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/documents
 * Store a new document
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { fileContent, fileName, fileType, title, description } = body;

    if (!fileContent || !fileName || !fileType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fileContent, fileName, fileType' },
        { status: 400 }
      );
    }

    const result = await storeDocumentInPineconeViaPython({
      fileContent,
      fileName,
      fileType,
      title,
      description,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error storing document:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/documents
 * Delete a document
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Missing document ID' },
        { status: 400 }
      );
    }

    const result = await deleteDocumentFromPineconeViaPython(documentId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
