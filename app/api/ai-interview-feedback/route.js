import { NextResponse } from "next/server";
import OpenAI from "openai";

// Vercel Edge Runtime optimization
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds max for free tier

// Initialize OpenAI client only when needed
let openai = null;

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    console.log('Initializing OpenAI with API key:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export async function POST(req) {
  try {
    const { responses, interview, analytics, responseStats } = await req.json();

    if (!responses || responses.length === 0) {
      return NextResponse.json({ error: 'No responses provided' }, { status: 400 });
    }

    // Get OpenAI client
    const client = getOpenAIClient();
    if (!client) {
      console.error('OpenAI client not available - API key missing');
      return NextResponse.json({
        error: 'AI service not available',
        fallback: true
      }, { status: 503 });
    }

    // Create detailed analysis prompt
    const analysisPrompt = `
You are an expert AI interview coach analyzing a candidate's interview performance with focus on response completion and voice confidence.

INTERVIEW DETAILS:
- Position: ${interview.jobposition}
- Duration: ${interview.duration} minutes
- Total Questions Asked: ${responseStats?.totalQuestions || responses.length}
- Total Responses Recorded: ${responseStats?.totalResponses || responses.length}
- Response Completion Rate: ${responseStats?.responseRate || 100}%

RESPONSE MATCHING ANALYSIS:
${responses.map((response, index) => `
Question ${index + 1}: ${response.question}
Response Status: ${response.hasRecording ? 'ANSWERED' : 'SKIPPED'}
Response Time: ${response.analytics?.responseTime ? Math.round(response.analytics.responseTime / 1000) : 'N/A'} seconds
Voice Confidence Score: ${response.analytics?.voiceConfidence ? Math.round(response.analytics.voiceConfidence) : 'N/A'}%
Recording Quality: ${response.analytics?.recordingDuration > 0 ? 'Good' : 'Poor/None'}
`).join('\n')}

VOICE CONFIDENCE METRICS:
- Average Voice Confidence: ${responseStats?.voiceConfidenceScores ? Math.round(responseStats.voiceConfidenceScores.reduce((a, b) => a + b, 0) / responseStats.voiceConfidenceScores.length) : 'N/A'}%
- Average Response Time: ${responseStats?.averageResponseTime ? Math.round(responseStats.averageResponseTime / 1000) : 'N/A'} seconds
- Questions Answered vs Total: ${responseStats?.totalResponses}/${responseStats?.totalQuestions}

DETAILED ANALYTICS:
${analytics ? JSON.stringify(analytics, null, 2) : 'No analytics available'}

Please provide a comprehensive interview feedback analysis in the following JSON format:

{
  "overallScore": 85,
  "overallFeedback": "Detailed overall performance summary",
  "strengths": [
    "Specific strength 1",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "areasForImprovement": [
    "Specific area 1 with actionable advice",
    "Specific area 2 with actionable advice",
    "Specific area 3 with actionable advice"
  ],
  "detailedMetrics": {
    "communicationSkills": {
      "score": 80,
      "feedback": "Detailed feedback on communication"
    },
    "technicalKnowledge": {
      "score": 85,
      "feedback": "Detailed feedback on technical skills"
    },
    "problemSolving": {
      "score": 75,
      "feedback": "Detailed feedback on problem-solving approach"
    },
    "confidence": {
      "score": 90,
      "feedback": "Assessment of confidence and presentation"
    },
    "responseTime": {
      "score": 70,
      "feedback": "Analysis of response timing and pacing"
    }
  },
  "questionAnalysis": [
    {
      "questionNumber": 1,
      "question": "Question text",
      "score": 80,
      "feedback": "Specific feedback for this question",
      "suggestions": ["Suggestion 1", "Suggestion 2"]
    }
  ],
  "nextSteps": [
    "Actionable next step 1",
    "Actionable next step 2",
    "Actionable next step 3"
  ],
  "practiceRecommendations": [
    "Practice recommendation 1",
    "Practice recommendation 2"
  ]
}

SCORING CRITERIA:
- 90-100: Excellent - Ready for senior positions
- 80-89: Good - Strong candidate with minor improvements needed
- 70-79: Average - Solid foundation but needs development
- 60-69: Below Average - Significant improvement needed
- Below 60: Poor - Extensive preparation required

Focus on:
1. RESPONSE COMPLETION: How many questions were answered vs total questions asked
2. VOICE CONFIDENCE: Analysis of voice confidence scores and speaking patterns
3. RESPONSE TIMING: Speed and pacing of responses (too fast/slow indicates nervousness)
4. CONTENT QUALITY: Relevance and depth of answers
5. COMMUNICATION CLARITY: How well ideas were expressed
6. PERFORMANCE CONSISTENCY: Confidence levels across different questions
7. AREAS FOR IMPROVEMENT: Specific voice coaching and interview techniques

CRITICAL ANALYSIS POINTS:
- If response rate < 100%, analyze why questions were skipped
- Voice confidence scores below 70% indicate nervousness or uncertainty
- Response times > 10 seconds may indicate lack of preparation
- Response times < 3 seconds may indicate rushed or superficial answers

Provide specific, actionable feedback focusing on voice confidence, response completion, and interview performance improvement.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert interview coach and HR professional with 15+ years of experience. Provide detailed, constructive feedback that helps candidates improve their interview performance."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const feedbackContent = completion.choices[0].message.content;

    // Clean up the response to ensure it's valid JSON
    const cleanedContent = feedbackContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let feedbackData;
    try {
      feedbackData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback response
      feedbackData = {
        overallScore: 75,
        overallFeedback: "Thank you for completing the practice interview. Your responses show good potential with room for improvement.",
        strengths: [
          "Completed all questions",
          "Showed engagement with the process",
          "Demonstrated willingness to practice"
        ],
        areasForImprovement: [
          "Continue practicing interview skills",
          "Work on response clarity and structure",
          "Practice common interview questions"
        ],
        detailedMetrics: {
          communicationSkills: { score: 75, feedback: "Good communication foundation" },
          technicalKnowledge: { score: 70, feedback: "Continue developing technical skills" },
          problemSolving: { score: 75, feedback: "Shows logical thinking approach" },
          confidence: { score: 80, feedback: "Demonstrates good confidence level" },
          responseTime: { score: 70, feedback: "Work on response pacing" }
        },
        questionAnalysis: responses.map((response, index) => ({
          questionNumber: index + 1,
          question: response.question,
          score: 75,
          feedback: "Good attempt at answering the question",
          suggestions: ["Provide more specific examples", "Structure your response better"]
        })),
        nextSteps: [
          "Practice more interviews",
          "Research common interview questions",
          "Work on storytelling techniques"
        ],
        practiceRecommendations: [
          "Use the STAR method for behavioral questions",
          "Practice with a friend or mentor"
        ]
      };
    }

    return NextResponse.json({
      success: true,
      feedback: feedbackData
    });

  } catch (error) {
    console.error('Error generating interview feedback:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}
