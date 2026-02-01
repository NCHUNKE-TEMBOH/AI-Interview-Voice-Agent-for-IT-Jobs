import { NextResponse } from 'next/server';
import { queryPinecone } from '@/lib/pinecone-service';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST - Query the RAG system
 */
export async function POST(request) {
  try {
    const { query, topK = 5, useRAG = true } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required',
        },
        { status: 400 }
      );
    }

    console.log(`Processing RAG query: "${query}"`);

    let context = '';
    let sources = [];

    if (useRAG) {
      // Query Pinecone for relevant documents
      const results = await queryPinecone(query, topK);

      if (results.length > 0) {
        // Build context from retrieved chunks
        context = results
          .map((result, index) => {
            sources.push({
              id: result.id,
              title: result.title,
              fileName: result.fileName,
              score: result.score,
              chunkIndex: result.chunkIndex,
            });
            return `[Source ${index + 1}: ${result.title}]\n${result.content}`;
          })
          .join('\n\n');

        console.log(`Retrieved ${results.length} relevant chunks`);
      } else {
        console.log('No relevant documents found');
      }
    }

    // Generate response using Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = context
      ? `You are a helpful AI assistant for the AI Interview Voice Agent platform. Use the following context from uploaded documents to answer the user's question.

CONTEXT:
${context}

USER QUESTION:
${query}

INSTRUCTIONS:
- Use the provided context to answer the question
- If the context doesn't contain the answer, say so clearly
- Be concise and direct
- Cite the sources you used (e.g., [Source 1], [Source 2])
- If multiple sources provide information, synthesize them

ANSWER:`
      : `You are a helpful AI assistant for the AI Interview Voice Agent platform. Answer the user's question to the best of your ability.

USER QUESTION:
${query}

INSTRUCTIONS:
- Be helpful and informative
- If you don't know the answer, say so clearly
- Keep your response concise and relevant

ANSWER:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log('Generated response');

    return NextResponse.json({
      success: true,
      query,
      response,
      context: context ? context.substring(0, 500) + '...' : '',
      sources,
      sourcesCount: sources.length,
    });
  } catch (error) {
    console.error('Error processing RAG query:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
