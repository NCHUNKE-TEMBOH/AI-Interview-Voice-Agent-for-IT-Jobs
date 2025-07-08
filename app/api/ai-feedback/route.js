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
  // Generate performance-based feedback
  const getPerformanceBasedFeedback = (questionsAnswered, totalQuestions, duration) => {
    const completionRate = totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0;

    // Poor performance (0-2 questions or very short duration)
    if (questionsAnswered <= 2 || duration < 5) {
      return {
        overallScore: questionsAnswered === 0 ? 5 : Math.max(10, questionsAnswered * 8),
        strengths: questionsAnswered === 0 ? ["Attended the interview session"] : ["Made minimal attempt to participate"],
        improvements: [
          "Complete all interview questions",
          "Provide substantive, detailed responses",
          "Demonstrate better preparation and engagement",
          "Practice interview skills extensively",
          "Show more enthusiasm and interest",
          "Improve communication clarity"
        ],
        areasForImprovement: [
          "Interview completion rate - Critical",
          "Response quality and depth - Poor",
          "Communication engagement - Inadequate",
          "Technical knowledge demonstration - Insufficient",
          "Professional presentation - Needs significant improvement"
        ],
        recommendation: questionsAnswered === 0
          ? "POOR PERFORMANCE: The candidate did not answer any questions during the interview. This is unacceptable for any professional role. Extensive preparation and practice are required before attempting another interview."
          : `POOR PERFORMANCE: The candidate answered only ${questionsAnswered} question(s) out of ${totalQuestions}, showing inadequate preparation and engagement. This performance is below professional standards and requires significant improvement.`,
        overallFeedback: questionsAnswered === 0
          ? "UNACCEPTABLE: No meaningful participation in the interview. This indicates severe lack of preparation, technical issues, or unprofessional behavior."
          : `POOR: Minimal participation with only ${questionsAnswered} question(s) answered. This performance is insufficient for professional consideration and requires substantial improvement.`,
        communicationScore: questionsAnswered === 0 ? 5 : Math.max(8, questionsAnswered * 10),
        technicalScore: questionsAnswered === 0 ? 3 : Math.max(5, questionsAnswered * 8),
        confidenceLevel: "Very Low",
        questionsCompleted: questionsAnswered,
        actualDuration: duration,
        completionRate: Math.round(completionRate)
      };
    }

    // Average performance (3-4 questions)
    if (questionsAnswered <= 4) {
      return {
        overallScore: 35 + (questionsAnswered * 6),
        strengths: [
          "Participated in most of the interview process",
          "Provided responses to several questions",
          "Showed some engagement with the interviewer"
        ],
        improvements: [
          "Complete ALL interview questions - this is essential",
          "Provide more comprehensive and detailed answers",
          "Include specific examples and experiences in responses",
          "Demonstrate better preparation and knowledge",
          "Show more enthusiasm and professional interest"
        ],
        areasForImprovement: [
          "Interview completion rate - Incomplete",
          "Response comprehensiveness - Below expectations",
          "Technical depth - Insufficient",
          "Professional engagement - Needs improvement",
          "Preparation level - Inadequate"
        ],
        recommendation: `BELOW AVERAGE: The candidate answered only ${questionsAnswered} out of ${totalQuestions} questions (${Math.round(completionRate)}% completion). This incomplete performance indicates insufficient preparation and engagement. Significant improvement is needed for professional consideration.`,
        overallFeedback: `BELOW EXPECTATIONS: Incomplete interview participation with only ${questionsAnswered} questions answered. While the candidate showed some engagement, the performance falls short of professional standards and requires substantial improvement.`,
        communicationScore: 35 + (questionsAnswered * 6),
        technicalScore: 25 + (questionsAnswered * 8),
        confidenceLevel: "Low",
        questionsCompleted: questionsAnswered,
        actualDuration: duration,
        completionRate: Math.round(completionRate)
      };
    }

    // Good performance (5+ questions)
    return {
      overallScore: 75 + Math.min(20, (questionsAnswered - 5) * 4),
      strengths: [
        "Completed the full interview",
        "Engaged actively with all questions",
        "Demonstrated good communication skills",
        "Showed enthusiasm for the role"
      ],
      improvements: [
        "Continue developing technical skills",
        "Practice providing specific examples",
        "Enhance industry knowledge"
      ],
      areasForImprovement: [
        "Technical expertise depth",
        "Industry-specific knowledge"
      ],
      recommendation: `Excellent interview completion with ${questionsAnswered} questions answered. The candidate demonstrated strong engagement and communication skills throughout the interview process.`,
      overallFeedback: `Strong performance with complete interview participation. The candidate showed good preparation and communication abilities.`,
      communicationScore: 80 + Math.min(15, (questionsAnswered - 5) * 3),
      technicalScore: 70 + Math.min(20, (questionsAnswered - 5) * 4),
      confidenceLevel: "High",
      questionsCompleted: questionsAnswered,
      actualDuration: duration,
      completionRate: Math.round(completionRate)
    };
  };

  try {
    // Check if OpenAI client is initialized
    if (!openai) {
      console.error('OpenAI client is not initialized');
      return NextResponse.json({
        content: JSON.stringify(getPerformanceBasedFeedback(0, 5, 0)),
        warning: 'Using performance-based feedback because OpenAI client is not initialized'
      });
    }

    // Parse request body
    let conversation, jobTitle, jobDescription, requiredSkills, companyCriteria, interviewMetrics;
    try {
      const body = await request.json();
      conversation = body.conversation;
      jobTitle = body.jobTitle;
      jobDescription = body.jobDescription;
      requiredSkills = body.requiredSkills;
      companyCriteria = body.companyCriteria;
      interviewMetrics = body.interviewMetrics || {};

      console.log('Received request to generate feedback for:', jobTitle);
      console.log('Interview metrics:', interviewMetrics);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({
        content: JSON.stringify(getPerformanceBasedFeedback(0, 5, 0)),
        error: 'Invalid request format'
      }, { status: 400 });
    }

    // Validate required fields and extract metrics
    const questionsCompleted = interviewMetrics.questionsCompleted || 0;
    const totalQuestions = interviewMetrics.totalQuestions || 5;
    const actualDuration = interviewMetrics.actualDuration || 0;

    if (!conversation) {
      console.warn('Conversation data is missing, using performance-based feedback');
      return NextResponse.json({
        content: JSON.stringify(getPerformanceBasedFeedback(questionsCompleted, totalQuestions, actualDuration)),
        warning: 'Using performance-based feedback due to missing conversation data'
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
        content: JSON.stringify(getPerformanceBasedFeedback(questionsCompleted, totalQuestions, actualDuration)),
        warning: 'Invalid conversation format, using performance-based feedback'
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

    // Count actual user responses (excluding empty or very short responses)
    const userResponses = messages.filter(m => m.role === 'user' && m.content && m.content.trim().length > 10);
    const actualQuestionsAnswered = userResponses.length;
    const completionRate = totalQuestions > 0 ? Math.round((actualQuestionsAnswered / totalQuestions) * 100) : 0;

    // Create the prompt for analyzing the interview
    const prompt = `
You are an expert HR professional analyzing an interview for a ${jobTitle || 'professional'} position.

INTERVIEW PERFORMANCE METRICS:
- Questions Completed: ${actualQuestionsAnswered} out of ${totalQuestions} (${completionRate}% completion rate)
- Interview Duration: ${actualDuration} minutes
- Total Messages: ${messages.length}
- User Responses: ${actualQuestionsAnswered}

Job Description: ${jobDescription || 'Not provided'}
Required Skills: ${requiredSkills || 'Not provided'}
Company Criteria: ${companyCriteria || 'Looking for qualified candidates with relevant skills and experience'}

Below is the transcript of the interview:

${formattedConversation}

CRITICAL SCORING GUIDELINES - BE STRICT AND REALISTIC:
- If candidate answered 0 questions: Score 5-15 (UNACCEPTABLE - Failed interview)
- If candidate answered 1-2 questions: Score 10-25 (POOR - Inadequate performance)
- If candidate answered 3-4 questions: Score 30-50 (BELOW AVERAGE - Incomplete performance)
- If candidate answered 5+ questions: Score 60-85 (ACCEPTABLE to GOOD performance)
- Only give 85+ scores for truly exceptional responses with depth and insight
- Consider response quality heavily - short, vague answers should be scored lower
- Be harsh on incomplete interviews - this is unprofessional behavior
- Incomplete participation (less than 80% completion) should receive poor scores

Please analyze the candidate's responses and provide feedback in the following JSON format:

\`\`\`json
{
  "overallScore": [STRICT SCORING: 5-15 for failed, 10-25 for poor, 30-50 for below average, 60-85 for acceptable/good],
  "strengths": ["List ONLY actual strengths demonstrated - be honest, use 'minimal strengths' if performance was poor"],
  "improvements": ["List extensive improvements needed for poor performance, be specific and direct"],
  "areasForImprovement": ["List critical areas needing improvement, mark as 'Critical' or 'Poor' for bad performance"],
  "recommendation": "Be brutally honest - use terms like 'POOR PERFORMANCE', 'UNACCEPTABLE', 'BELOW PROFESSIONAL STANDARDS' for bad interviews",
  "overallFeedback": "Give honest, direct feedback that reflects reality - don't sugarcoat poor performance",
  "communicationScore": [Score communication harshly if responses were minimal or unclear],
  "technicalScore": [Score technical ability based on actual demonstration, not potential],
  "confidenceLevel": "Very Low|Low|Medium|High [be realistic - most incomplete interviews should be Very Low or Low]",
  "questionsCompleted": ${actualQuestionsAnswered},
  "actualDuration": ${actualDuration},
  "completionRate": ${completionRate}
}
\`\`\`

CRITICAL INSTRUCTIONS:
1. Base your analysis STRICTLY on actual performance demonstrated
2. If the candidate provided few or no meaningful responses, give them a POOR score (5-25)
3. Incomplete interviews (less than 80% completion) should receive scores below 50
4. Do NOT be generous with scoring - be realistic and professional
5. Use harsh language for poor performance: "UNACCEPTABLE", "POOR", "BELOW STANDARDS"
6. Only candidates who complete most/all questions with quality responses deserve good scores
7. Short, vague, or irrelevant answers should be scored harshly
8. Professional interviews require professional participation - score accordingly
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
          content: JSON.stringify(getPerformanceBasedFeedback(actualQuestionsAnswered, totalQuestions, actualDuration)),
          warning: 'Invalid response from AI service, using performance-based feedback'
        });
      }

      const content = response.choices[0].message.content;
      console.log('Raw content from OpenAI:', content.substring(0, 100) + '...');

      return NextResponse.json({ content });
    } catch (aiError) {
      console.error('Error calling OpenAI API:', aiError);

      // Return performance-based feedback if AI call fails
      return NextResponse.json({
        content: JSON.stringify(getPerformanceBasedFeedback(actualQuestionsAnswered || 0, totalQuestions || 5, actualDuration || 0)),
        warning: 'Error generating custom feedback, using performance-based assessment'
      });
    }
  } catch (error) {
    console.error('Unhandled error in ai-feedback API:', error);
    return NextResponse.json({
      content: JSON.stringify(getPerformanceBasedFeedback(0, 5, 0)),
      error: 'Internal server error'
    }, { status: 500 });
  }
}
