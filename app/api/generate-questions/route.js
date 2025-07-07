import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Vercel Edge Runtime optimization
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds max for free tier

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
  // Default questions to use as fallback
  const getDefaultQuestions = (jobTitle) => [
    `Tell me about your experience related to ${jobTitle || 'this role'}.`,
    `What specific skills do you have that make you a good fit for this ${jobTitle || 'position'}?`,
    `How do you stay updated with the latest trends and technologies in this field?`,
    `Describe a challenging project you worked on and how you overcame obstacles.`,
    `How do you handle tight deadlines and pressure?`,
    `Give an example of how you've used problem-solving skills in a previous role.`,
    `How do you collaborate with team members who have different working styles?`,
    `What interests you most about this position?`,
    `Where do you see yourself professionally in 5 years?`,
    `Do you have any questions about the role or company?`
  ];

  try {
    // Check if OpenAI client is initialized
    if (!openai) {
      console.error('OpenAI client is not initialized');
      return NextResponse.json({
        questions: getDefaultQuestions('this role'),
        warning: 'Using default questions because OpenAI client is not initialized'
      });
    }

    // Parse request body
    let jobTitle, jobDescription, requiredSkills, experienceLevel, questionCount;
    try {
      const body = await request.json();
      jobTitle = body.jobTitle;
      jobDescription = body.jobDescription;
      requiredSkills = body.requiredSkills;
      experienceLevel = body.experienceLevel;
      questionCount = body.questionCount || 10;

      console.log('Received request to generate questions for:', jobTitle);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({
        questions: getDefaultQuestions('this role'),
        error: 'Invalid request format'
      }, { status: 400 });
    }

    // Validate required fields
    if (!jobTitle) {
      console.warn('Job title is missing, using default questions');
      return NextResponse.json({
        questions: getDefaultQuestions('this role'),
        warning: 'Job title is required for customized questions'
      });
    }

    // Create the prompt for generating interview questions
    const prompt = `
Generate ${questionCount} interview questions for a ${jobTitle} position.

Job Description: ${jobDescription || 'Not provided'}

Required Skills: ${requiredSkills || 'Not provided'}

Experience Level: ${experienceLevel || 'Mid-Level'}

Please generate a JSON array of ${questionCount} questions that would be appropriate for this position.
The questions should assess the candidate's skills, experience, and fit for the role.
Each question should be clear, concise, and directly related to the job requirements.

Format the response as a valid JSON array of strings, with each string being a question.
Example format:
[
  "Question 1?",
  "Question 2?",
  "Question 3?"
]
`;

    try {
      console.log('Calling OpenAI to generate questions...');

      // Call OpenAI to generate questions
      const response = await openai.chat.completions.create({
        model: 'openai/gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR professional who specializes in creating interview questions for technical positions.'
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

      // Extract the generated questions
      if (!response.choices || response.choices.length === 0 || !response.choices[0].message) {
        console.error('Invalid response from OpenAI:', response);
        return NextResponse.json({
          questions: getDefaultQuestions(jobTitle),
          warning: 'Invalid response from AI service'
        });
      }

      const content = response.choices[0].message.content;
      console.log('Raw content from OpenAI:', content.substring(0, 100) + '...');

      // Parse the JSON response
      let questions;
      try {
        // Try to extract JSON if it's wrapped in markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/\[([\s\S]*?)\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        questions = JSON.parse(jsonString);

        console.log('Successfully parsed questions:', questions.length);
      } catch (parseError) {
        console.error('Error parsing questions JSON:', parseError);

        // Fallback to default questions if parsing fails
        questions = getDefaultQuestions(jobTitle);
        console.log('Using default questions due to parsing error');
      }

      return NextResponse.json({ questions });
    } catch (aiError) {
      console.error('Error calling OpenAI API:', aiError);

      // Return default questions if AI call fails
      return NextResponse.json({
        questions: getDefaultQuestions(jobTitle),
        warning: 'Error generating custom questions, using defaults'
      });
    }
  } catch (error) {
    console.error('Unhandled error in generate-questions API:', error);
    return NextResponse.json({
      questions: getDefaultQuestions('this role'),
      error: 'Internal server error'
    }, { status: 500 });
  }
}
