import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI with your API key
let openai;
try {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not defined in environment variables');
  } else {
    console.log('Initializing OpenAI with API key:', process.env.OPENROUTER_API_KEY.substring(0, 10) + '...');
  }

  openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || 'dummy-key-for-initialization',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://interview-voice-agent.vercel.app',
      'X-Title': 'AI Interview Scheduler',
    },
  });
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

export async function POST(request) {
  // Default feedback to use as fallback
  const getDefaultFeedback = () => ({
    feedback: {
      strengths: ["Communication skills", "Professional attitude", "Enthusiasm for the role"],
      areas_for_improvement: ["More specific examples needed", "Technical knowledge could be deeper"],
      overall_assessment: "Candidate showed potential for the role and demonstrated good communication skills. With some additional experience and technical knowledge, they could be a good fit for the position.",
      matchScore: 70
    }
  });

  try {
    // Check if OpenAI client is initialized
    if (!openai) {
      console.error('OpenAI client is not initialized');
      return NextResponse.json({
        content: JSON.stringify(getDefaultFeedback()),
        warning: 'Using default feedback because OpenAI client is not initialized'
      });
    }

    // Parse request body
    let conversation, jobTitle, jobDescription, requiredSkills, companyCriteria;
    try {
      const body = await request.json();
      conversation = body.conversation;
      jobTitle = body.jobTitle;
      jobDescription = body.jobDescription;
      requiredSkills = body.requiredSkills;
      companyCriteria = body.companyCriteria;

      console.log('Received request to generate feedback for:', jobTitle);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({
        content: JSON.stringify(getDefaultFeedback()),
        error: 'Invalid request format'
      }, { status: 400 });
    }

    // Validate required fields
    if (!conversation) {
      console.warn('Conversation data is missing, using default feedback');
      return NextResponse.json({
        content: JSON.stringify(getDefaultFeedback()),
        warning: 'Conversation data is required for customized feedback'
      });
    }

    // Parse the conversation if it's a string
    let parsedConversation;
    try {
      parsedConversation = typeof conversation === 'string' ? JSON.parse(conversation) : conversation;
      console.log('Successfully parsed conversation data');
    } catch (error) {
      console.error('Error parsing conversation:', error);
      return NextResponse.json({
        content: JSON.stringify(getDefaultFeedback()),
        warning: 'Invalid conversation format, using default feedback'
      });
    }

    // Extract messages from the conversation
    let messages = [];
    if (parsedConversation.messages) {
      messages = parsedConversation.messages;
    } else if (Array.isArray(parsedConversation)) {
      messages = parsedConversation;
    } else {
      console.warn('Unexpected conversation format, using default messages');
      // Create a default conversation if the format is unexpected
      messages = [
        { role: 'assistant', content: 'Hello, welcome to your interview.' },
        { role: 'user', content: 'Thank you for the opportunity.' }
      ];
    }

    // Ensure we have at least two messages
    if (messages.length < 2) {
      console.warn('Conversation too short, adding default messages');
      messages.push(
        { role: 'assistant', content: 'Thank you for your time today. Do you have any questions for me?' },
        { role: 'user', content: 'No, thank you for the opportunity.' }
      );
    }

    console.log(`Processing conversation with ${messages.length} messages`);

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
If the conversation is very short or limited, provide a fair assessment based on what's available.
`;

    try {
      console.log('Calling OpenAI to generate feedback...');

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

      console.log('OpenAI response received');

      // Extract the generated feedback
      if (!response.choices || response.choices.length === 0 || !response.choices[0].message) {
        console.error('Invalid response from OpenAI:', response);
        return NextResponse.json({
          content: JSON.stringify(getDefaultFeedback()),
          warning: 'Invalid response from AI service'
        });
      }

      const content = response.choices[0].message.content;
      console.log('Raw content from OpenAI:', content.substring(0, 100) + '...');

      return NextResponse.json({ content });
    } catch (aiError) {
      console.error('Error calling OpenAI API:', aiError);

      // Return default feedback if AI call fails
      return NextResponse.json({
        content: JSON.stringify(getDefaultFeedback()),
        warning: 'Error generating custom feedback, using defaults'
      });
    }
  } catch (error) {
    console.error('Unhandled error in ai-feedback API:', error);
    return NextResponse.json({
      content: JSON.stringify(getDefaultFeedback()),
      error: 'Internal server error'
    }, { status: 500 });
  }
}
