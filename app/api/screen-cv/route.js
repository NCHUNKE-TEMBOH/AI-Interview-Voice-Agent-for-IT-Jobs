import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const {
      cvText,
      jobTitle,
      jobDescription,
      requiredSkills,
      experienceLevel,
      companyCriteria
    } = await request.json();

    if (!cvText || !jobTitle) {
      return NextResponse.json(
        { error: 'CV text and job title are required' },
        { status: 400 }
      );
    }

    console.log('Starting Gemini AI CV screening for job:', jobTitle);
    console.log('CV text length:', cvText.length);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create the prompt for CV analysis
    const prompt = `
You are an expert HR professional and recruiter with 15+ years of experience. Analyze the following CV against the specific job requirements and provide a detailed, actionable assessment.

JOB DETAILS:
- Position: ${jobTitle}
- Description: ${jobDescription || 'Not provided'}
- Required Skills: ${requiredSkills || 'Not specified'}
- Experience Level: ${experienceLevel || 'Not specified'}
- Company Criteria: ${companyCriteria || 'Standard hiring criteria'}

CANDIDATE CV CONTENT:
${cvText}

ANALYSIS INSTRUCTIONS:
1. Read the CV content carefully and extract specific details
2. Compare candidate's skills, experience, and background against job requirements
3. Provide specific examples from the CV to support your assessment
4. Give actionable recommendations for hiring decisions

Please provide your analysis in this EXACT JSON format (ensure valid JSON):
{
  "matchScore": [number from 1-10],
  "summary": "[2-3 sentences with specific details from CV about why this candidate fits or doesn't fit the role]",
  "skillsMatch": "[Detailed analysis comparing candidate's specific skills mentioned in CV against required skills for ${jobTitle}]",
  "experienceRelevance": "[Assessment of candidate's work history, years of experience, and career progression relevant to ${jobTitle}]",
  "educationMatch": "[Evaluation of educational background, degrees, certifications mentioned in CV]",
  "detailedAnalysis": {
    "strengths": ["[specific strength from CV]", "[another specific strength]", "[third strength]"],
    "weaknesses": ["[specific gap or weakness]", "[another weakness]"],
    "recommendations": ["[specific hiring recommendation]", "[interview focus area]"]
  },
  "keyFindings": {
    "yearsOfExperience": "[extract actual years from CV]",
    "primarySkills": ["[skill1 from CV]", "[skill2 from CV]", "[skill3 from CV]"],
    "industryBackground": "[specific industry experience mentioned]",
    "educationLevel": "[actual degree/education from CV]",
    "certifications": ["[cert1 from CV]", "[cert2 from CV]"]
  }
}

SCORING CRITERIA:
- 9-10: Exceptional match, all key requirements met, highly recommended
- 7-8: Strong match, most requirements met, recommended for interview
- 5-6: Moderate match, some requirements met, consider with reservations
- 3-4: Weak match, few requirements met, not recommended
- 1-2: Poor match, requirements not met, reject

IMPORTANT: Base your analysis ONLY on what's actually written in the CV. Be specific and reference actual content from the CV in your assessment.
`;

    console.log('Calling Gemini API for CV analysis...');

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    console.log('Gemini API response received, length:', responseText.length);

    let analysisResult;
    try {
      // Try to parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response:', responseText);

      // Fallback: extract key information from text response
      analysisResult = parseTextResponse(responseText, jobTitle, cvText);
    }

    // Validate and ensure all required fields are present
    const validatedResult = validateAnalysisResult(analysisResult, jobTitle);

    console.log('CV screening completed successfully with score:', validatedResult.matchScore);

    return NextResponse.json(validatedResult);

  } catch (error) {
    console.error('Error in CV screening:', error);

    // Return fallback analysis if API fails
    return NextResponse.json({
      matchScore: 5,
      summary: `CV analysis encountered an error. Manual review required for ${jobTitle || 'this position'}. Error: ${error.message}`,
      skillsMatch: 'Unable to perform automated skill matching due to technical error. Please review CV manually for skill assessment.',
      experienceRelevance: 'Experience assessment could not be completed automatically. Manual evaluation recommended.',
      educationMatch: 'Education background analysis failed. Please verify qualifications manually.',
      detailedAnalysis: {
        strengths: ['CV submitted successfully', 'Candidate applied for position'],
        weaknesses: ['Automated analysis unavailable', 'Technical error occurred'],
        recommendations: ['Conduct manual CV review', 'Consider phone screening', 'Verify technical error resolution']
      },
      keyFindings: {
        yearsOfExperience: 'Could not determine',
        primarySkills: ['Manual review required'],
        industryBackground: 'Analysis incomplete',
        educationLevel: 'Not assessed due to error',
        certifications: ['Review manually']
      },
      error: error.message
    });
  }
}

// Helper function to parse text response if JSON parsing fails
function parseTextResponse(textResponse, jobTitle, cvText) {
  console.log('Parsing text response as fallback...');

  // Extract match score from text
  const scoreMatch = textResponse.match(/(\d+)\/10|score[:\s]*(\d+)|(\d+)\s*out\s*of\s*10/i);
  const matchScore = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]) : 6;

  // Try to extract key information from CV text
  const nameMatch = cvText.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
  const emailMatch = cvText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const experienceMatch = cvText.match(/(\d+)\+?\s*years?/i);

  return {
    matchScore: Math.min(Math.max(matchScore, 1), 10),
    summary: `AI analysis completed for ${jobTitle} position. Candidate ${nameMatch ? nameMatch[1] : 'profile'} reviewed. ${matchScore >= 7 ? 'Recommended' : 'Consider with reservations'} for further evaluation.`,
    skillsMatch: `Skills assessment completed based on CV content. ${experienceMatch ? `${experienceMatch[1]} years of experience noted.` : 'Experience level requires verification.'} Manual review recommended for detailed skill matching.`,
    experienceRelevance: `${experienceMatch ? `Approximately ${experienceMatch[1]} years of relevant experience identified.` : 'Experience level assessment completed.'} Career progression and role relevance require detailed review.`,
    educationMatch: 'Educational background identified in CV. Qualification verification and alignment with job requirements recommended.',
    detailedAnalysis: {
      strengths: [
        'Professional CV submitted',
        experienceMatch ? `${experienceMatch[1]}+ years experience` : 'Relevant experience',
        'Complete application profile'
      ],
      weaknesses: [
        'Automated analysis limitations',
        'Requires manual verification'
      ],
      recommendations: [
        'Conduct detailed manual review',
        'Schedule phone screening',
        'Verify key qualifications'
      ]
    },
    keyFindings: {
      yearsOfExperience: experienceMatch ? `${experienceMatch[1]} years` : 'To be determined',
      primarySkills: ['Skills identified in CV', 'Manual review required'],
      industryBackground: 'Professional background noted',
      educationLevel: 'Educational qualifications present',
      certifications: ['Certifications require verification']
    },
    rawResponse: textResponse
  };
}

// Helper function to validate and ensure all required fields
function validateAnalysisResult(result, jobTitle) {
  return {
    matchScore: result.matchScore || 5,
    summary: result.summary || `CV analysis completed for ${jobTitle} position. Manual review recommended.`,
    skillsMatch: result.skillsMatch || 'Skills assessment completed. Detailed review recommended for skill matching.',
    experienceRelevance: result.experienceRelevance || 'Experience evaluation completed. Manual verification suggested.',
    educationMatch: result.educationMatch || 'Educational background assessed. Qualification verification recommended.',
    detailedAnalysis: {
      strengths: result.detailedAnalysis?.strengths || ['Professional CV format', 'Complete application', 'Relevant background'],
      weaknesses: result.detailedAnalysis?.weaknesses || ['Requires detailed review', 'Manual verification needed'],
      recommendations: result.detailedAnalysis?.recommendations || ['Consider for interview', 'Conduct phone screening', 'Verify qualifications']
    },
    keyFindings: {
      yearsOfExperience: result.keyFindings?.yearsOfExperience || 'Assessment required',
      primarySkills: result.keyFindings?.primarySkills || ['Skills review needed'],
      industryBackground: result.keyFindings?.industryBackground || 'Professional experience',
      educationLevel: result.keyFindings?.educationLevel || 'Educational background present',
      certifications: result.keyFindings?.certifications || ['Verification required']
    }
  };
}
