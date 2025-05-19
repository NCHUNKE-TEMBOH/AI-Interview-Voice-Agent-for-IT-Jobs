import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://interview-voice-agent.vercel.app',
    'X-Title': 'AI Interview Scheduler',
  },
});

export async function POST(request) {
  try {
    const { conversation, jobTitle, jobDescription, requiredSkills, companyCriteria } = await request.json();

    // Validate required fields
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation data is required' }, { status: 400 });
    }

    // Parse the conversation if it's a string
    let parsedConversation;
    try {
      parsedConversation = typeof conversation === 'string' ? JSON.parse(conversation) : conversation;
    } catch (error) {
      console.error('Error parsing conversation:', error);
      return NextResponse.json({ error: 'Invalid conversation format' }, { status: 400 });
    }

    // Extract messages from the conversation
    let messages = [];
    if (parsedConversation.messages) {
      messages = parsedConversation.messages;
    } else if (Array.isArray(parsedConversation)) {
      messages = parsedConversation;
    } else {
      // Create a default conversation if the format is unexpected
      messages = [
        { role: 'assistant', content: 'Hello, welcome to your interview.' },
        { role: 'user', content: 'Thank you for the opportunity.' }
      ];
    }

    // Format the conversation for analysis
    const formattedConversation = messages.map(msg => {
      const role = msg.role === 'assistant' ? 'Interviewer' : 'Candidate';
      return `${role}: ${msg.content}`;
    }).join('\n\n');

    // Create the prompt for analyzing the interview
    const prompt = `
You are an expert HR professional analyzing an interview for a ${jobTitle || 'professional'} position.

Job Description: ${jobDescription || 'Not provided'}

Required Skills: ${requiredSkills || 'Not provided'}

Company Criteria: ${companyCriteria || 'Looking for qualified candidates with relevant skills and experience'}

Below is the transcript of the interview:

${formattedConversation}

Please analyze the candidate's responses and provide feedback in the following JSON format:

\`\`\`json
{
  "feedback": {
    "strengths": ["List 3-5 strengths demonstrated by the candidate"],
    "areas_for_improvement": ["List 2-3 areas where the candidate could improve"],
    "overall_assessment": "A paragraph summarizing the candidate's performance and fit for the role",
    "matchScore": 75 // A score from 0-100 indicating how well the candidate matches the job requirements
  }
}
\`\`\`

Base your analysis on how well the candidate's responses align with the job requirements and company criteria.
`;

    // Call OpenAI to analyze the interview
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR professional who specializes in analyzing job interviews and providing constructive feedback.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Extract the generated feedback
    const content = response.choices[0].message.content;
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error generating feedback:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
