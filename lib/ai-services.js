import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "AIzaSyAgK32ThjpPUNT_-RM5XiXFKPtgAT1vpZI")

export async function evaluateCode(code, problem, testCases) {
  try {
    console.log("Using Gemini for code evaluation...")
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(`
      Evaluate this JavaScript code solution for the following problem:
      
      Problem: ${problem.title}
      Description: ${problem.description}
      
      User's Code:
      ${code}
      
      Test Cases:
      ${JSON.stringify(testCases, null, 2)}
      
      Expected Solution:
      ${problem.solution}
      
      Please provide:
      1. A score from 0-100 based on correctness, efficiency, and code quality
      2. Detailed feedback on the solution
      3. Whether the solution passes all test cases
      4. Suggestions for improvement
      5. Time and space complexity analysis
      
      Respond in JSON format:
      {
        "score": number,
        "passed": boolean,
        "feedback": "detailed feedback",
        "suggestions": ["suggestion1", "suggestion2"],
        "timeComplexity": "O(n)",
        "spaceComplexity": "O(1)",
        "testResults": [{"passed": true, "input": {}, "expected": {}, "actual": {}}]
      }
    `)
    const response = await result.response
    return JSON.parse(response.text())
  } catch (error) {
    console.error("Gemini failed:", error)

    // Fallback response if Gemini fails
    return {
      score: 50,
      passed: false,
      feedback: "Unable to evaluate code at this time. AI service is unavailable.",
      suggestions: ["Please try again later", "Check your internet connection"],
      timeComplexity: "Unknown",
      spaceComplexity: "Unknown",
      testResults: [],
    }
  }
}

export async function getAIRecommendations(userStats) {
  try {
    console.log("Using Gemini for recommendations...")
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(`
      Based on the following user statistics, provide personalized learning recommendations:
      
      User Stats:
      - Interviews completed: ${userStats.interviewsCompleted}
      - Average score: ${userStats.averageScore}%
      - Problems solved: ${userStats.problemsSolved}
      - Weak areas: ${userStats.weakAreas?.join(", ") || "None identified"}
      - Strong areas: ${userStats.strongAreas?.join(", ") || "None identified"}
      - Target companies: ${userStats.targetCompanies?.join(", ") || "FAANG"}
      
      Provide specific, actionable recommendations for:
      1. Technical skills to focus on
      2. Interview preparation strategies
      3. Practice problems to solve
      4. Areas for improvement
      5. Next steps in their learning journey
      
      Be encouraging but honest about areas that need work.
      Format your response in a clear, structured way with bullet points.
    `)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Gemini failed:", error)
    return "Unable to generate recommendations at this time. AI service is unavailable. Please try again later."
  }
}

export async function generateInterviewQuestion(type, difficulty, previousQuestions) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(`
      Generate a ${type} interview question with ${difficulty} difficulty level.

      Previous questions asked: ${previousQuestions.join(", ")}

      IMPORTANT: This question will be read aloud by text-to-speech, so:
      - DO NOT use markdown formatting (**, *, #, etc.)
      - DO NOT use special characters or symbols in the main question
      - Write the question in plain, spoken English
      - Keep technical terms simple and pronounceable
      - Use natural speech patterns

      Make sure the question is:
      1. Relevant to ${type} interviews
      2. Appropriate for ${difficulty} level
      3. Different from previous questions
      4. Realistic for FAANG-style interviews
      5. Clear and easy to understand when spoken aloud

      Format your response as a clear, conversational question that sounds natural when spoken.
      You can include additional context or expected answer approach after the main question, but keep the primary question clean for speech.
    `)
    const response = await result.response
    return cleanTextForSpeech(response.text())
  } catch (error) {
    console.error("Gemini failed:", error)
    return "Tell me about a challenging project you worked on recently."
  }
}

function cleanTextForSpeech(text) {
  return text
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
    .replace(/\*(.*?)\*/g, '$1') // Remove *italic*
    .replace(/#{1,6}\s*(.*?)$/gm, '$1') // Remove # headers
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Remove `code`
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove [links](url)

    // Remove special characters that sound weird when spoken
    .replace(/[_~`]/g, '') // Remove underscores, tildes, backticks
    .replace(/\n\s*\n/g, '. ') // Replace double newlines with periods
    .replace(/\n/g, ' ') // Replace single newlines with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space

    // Fix common speech issues
    .replace(/e\.g\./g, 'for example')
    .replace(/i\.e\./g, 'that is')
    .replace(/etc\./g, 'and so on')
    .replace(/vs\./g, 'versus')
    .replace(/\bAPI\b/g, 'A P I')
    .replace(/\bURL\b/g, 'U R L')
    .replace(/\bHTTP\b/g, 'H T T P')
    .replace(/\bJSON\b/g, 'J S O N')
    .replace(/\bSQL\b/g, 'S Q L')

    // Clean up punctuation for better speech flow
    .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure space after sentence endings
    .replace(/:\s*/g, ': ') // Ensure space after colons
    .replace(/;\s*/g, '; ') // Ensure space after semicolons

    .trim()
}
