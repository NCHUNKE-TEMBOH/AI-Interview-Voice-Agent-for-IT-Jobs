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
  // Generate performance-based feedback
  const getPerformanceBasedFeedback = (questionsAnswered, totalQuestions, duration) => {
    const completionRate = totalQuestions > 0 ? (questionsAnswered / totalQuestions) * 100 : 0;

    // Poor performance (0-2 questions or very short duration)
    if (questionsAnswered <= 2 || duration < 5) {
      return {
        overallScore: Math.max(15, questionsAnswered * 10),
        strengths: questionsAnswered > 0 ? ["Attempted to participate in the interview"] : ["Showed up for the interview"],
        improvements: [
          "Complete more interview questions",
          "Provide more detailed responses",
          "Engage more actively in the conversation",
          "Practice common interview questions"
        ],
        areasForImprovement: [
          "Interview completion rate",
          "Response depth and detail",
          "Communication engagement"
        ],
        recommendation: questionsAnswered === 0
          ? "The candidate did not answer any questions during the interview. This suggests they may need more preparation or were experiencing technical difficulties. We recommend additional practice sessions before proceeding."
          : `The candidate answered only ${questionsAnswered} question(s) out of ${totalQuestions}. This indicates limited engagement or preparation. More practice and preparation would be beneficial before future interviews.`,
        overallFeedback: questionsAnswered === 0
          ? "No responses were provided during the interview session. This could indicate technical issues, nervousness, or lack of preparation."
          : `Limited participation with only ${questionsAnswered} question(s) answered. The candidate would benefit from more interview practice and preparation.`,
        communicationScore: Math.max(10, questionsAnswered * 15),
        technicalScore: Math.max(5, questionsAnswered * 12),
        confidenceLevel: "Low",
        questionsCompleted: questionsAnswered,
        actualDuration: duration,
        completionRate: Math.round(completionRate)
      };
    }

    // Average performance (3-4 questions)
    if (questionsAnswered <= 4) {
      return {
        overallScore: 45 + (questionsAnswered * 8),
        strengths: [
          "Participated in the interview process",
          "Provided responses to multiple questions",
          "Showed engagement with the interviewer"
        ],
        improvements: [
          "Complete all interview questions",
          "Provide more comprehensive answers",
          "Include specific examples in responses"
        ],
        areasForImprovement: [
          "Interview completion",
          "Response comprehensiveness",
          "Technical depth"
        ],
        recommendation: `The candidate answered ${questionsAnswered} out of ${totalQuestions} questions, showing moderate engagement. With more preparation and practice, they could improve their interview performance significantly.`,
        overallFeedback: `Moderate performance with ${questionsAnswered} questions completed. The candidate demonstrated basic communication skills but could benefit from more thorough preparation.`,
        communicationScore: 50 + (questionsAnswered * 8),
        technicalScore: 40 + (questionsAnswered * 10),
        confidenceLevel: "Medium",
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

IMPORTANT SCORING GUIDELINES:
- If candidate answered 0-2 questions: Score should be 15-35 (Poor performance)
- If candidate answered 3-4 questions: Score should be 40-65 (Average performance)
- If candidate answered 5+ questions: Score should be 70-95 (Good to excellent performance)
- Consider response quality, not just quantity
- Be realistic about performance based on actual participation

Please analyze the candidate's responses and provide feedback in the following JSON format:

\`\`\`json
{
  "overallScore": [Score based on actual performance: 15-35 for poor, 40-65 for average, 70-95 for good],
  "strengths": ["List actual strengths demonstrated, or minimal if performance was poor"],
  "improvements": ["List specific areas for improvement based on actual performance"],
  "areasForImprovement": ["List specific areas for improvement based on actual performance"],
  "recommendation": "A realistic assessment based on actual interview participation and quality",
  "overallFeedback": "A honest evaluation reflecting the candidate's actual performance level",
  "communicationScore": [Score based on actual communication quality],
  "technicalScore": [Score based on technical responses provided],
  "confidenceLevel": "High|Medium|Low [based on actual performance]",
  "questionsCompleted": ${actualQuestionsAnswered},
  "actualDuration": ${actualDuration},
  "completionRate": ${completionRate}
}
\`\`\`

Base your analysis strictly on the actual performance demonstrated. If the candidate provided few or no meaningful responses, reflect this accurately in the scores and feedback.
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
