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
    const { jobTitle, jobDescription, requiredSkills, experienceLevel, questionCount = 10 } = await request.json();

    // Validate required fields
    if (!jobTitle) {
      return NextResponse.json({ error: 'Job title is required' }, { status: 400 });
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

    // Extract the generated questions
    const content = response.choices[0].message.content;
    
    // Parse the JSON response
    let questions;
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/\[([\s\S]*?)\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      questions = JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing questions JSON:', error);
      
      // Fallback to default questions if parsing fails
      questions = [
        `Tell me about your experience related to ${jobTitle}.`,
        `What specific skills do you have that make you a good fit for this ${jobTitle} position?`,
        `How do you stay updated with the latest trends and technologies in this field?`,
        `Describe a challenging project you worked on and how you overcame obstacles.`,
        `How do you handle tight deadlines and pressure?`,
        `Give an example of how you've used problem-solving skills in a previous role.`,
        `How do you collaborate with team members who have different working styles?`,
        `What interests you most about this position?`,
        `Where do you see yourself professionally in 5 years?`,
        `Do you have any questions about the role or company?`
      ];
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
