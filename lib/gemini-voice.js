import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "AIzaSyAgK32ThjpPUNT_-RM5XiXFKPtgAT1vpZI")

export class GeminiVoiceService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    this.synthesis = typeof window !== 'undefined' ? window.speechSynthesis : null
    this.recognition = null
    this.currentUtterance = null
    this.isListening = false
    this.isSpeaking = false
    this.canBeInterrupted = true
    this.onInterruptCallback = null
    this.silenceTimer = null
    this.voiceActivityDetection = true

    if (typeof window !== 'undefined') {
      this.setupSpeechRecognition()
    }
  }

  setupSpeechRecognition() {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = "en-US"
    }
  }

  async requestMicrophonePermission() {
    try {
      // Always return true for now - let speech recognition handle permissions
      return true
    } catch (error) {
      console.log("Microphone permission error:", error)
      return true // Still return true to allow the interview to proceed
    }
  }

  setInterruptCallback(callback) {
    this.onInterruptCallback = callback
  }

  setCanBeInterrupted(canInterrupt) {
    this.canBeInterrupted = canInterrupt
  }

  enableVoiceActivityDetection(enabled) {
    this.voiceActivityDetection = enabled
  }

  async generateResponse(prompt, context = "") {
    try {
      const fullPrompt = context ? `${context}\n\nUser: ${prompt}` : prompt
      const result = await this.model.generateContent(fullPrompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.log("Error generating response:", error)
      return "I apologize, but I'm having trouble processing your response right now. Could you please repeat that?"
    }
  }

  async generateConversationalResponse(prompt, context) {
    try {
      // Check if user is asking for help
      if (this.isHelpRequest(prompt)) {
        return this.generateHelpResponse(prompt, context)
      }

      // Analyze the user's response first
      const responseAnalysis = await this.analyzeUserResponse(prompt, context);

      const conversationalPrompt = `
        You are a professional technical interviewer conducting a real interview. You must analyze the candidate's response and provide appropriate feedback before proceeding.

        Interview Context: ${JSON.stringify(context, null, 2)}
        Current Question: "${context.currentQuestion}"
        User's Response: "${prompt}"
        Response Analysis: ${JSON.stringify(responseAnalysis, null, 2)}

        IMPORTANT: Your response will be read aloud by text-to-speech, so:
        - DO NOT use markdown formatting (**, *, #, etc.)
        - DO NOT use special characters or symbols
        - Write in plain, spoken English only
        - Use natural speech patterns

        As a professional interviewer, you must:
        1. FIRST acknowledge and briefly assess their response (2-3 sentences)
        2. Show you understood what they said
        3. Give constructive feedback if needed
        4. Then naturally transition to indicate you're moving to the next question

        Response Guidelines:
        - If they gave a good answer: "That's a solid approach. I can see you understand [specific concept]. Good."
        - If they said "I don't know": "I understand. That's okay, not everyone is familiar with that concept."
        - If answer was incomplete: "I see your thinking there. You touched on [what they got right], though there are a few other aspects to consider."
        - If answer was wrong: "I appreciate you taking a shot at that. Let me note your approach."

        Always end with a natural transition like:
        - "Alright, let's move on to the next question."
        - "Okay, let me ask you about something else."
        - "Let's shift gears a bit."

        Keep it professional, encouraging, and realistic like a real interview.
        Total response should be 3-4 sentences maximum.
      `

      const result = await this.model.generateContent(conversationalPrompt)
      const response = await result.response
      const cleanResponse = this.cleanTextForSpeech(response.text())
      return cleanResponse
    } catch (error) {
      console.log("Error generating conversational response:", error)
      return "I understand. Thank you for that response. Let's move on to the next question."
    }
  }

  async analyzeUserResponse(prompt, context) {
    try {
      const analysisPrompt = `
        Analyze this interview response comprehensively and return ONLY valid JSON without any markdown formatting:

        Question: "${context.currentQuestion}"
        Response: "${prompt}"

        Return only this JSON structure with no additional text, no markdown, no backticks:
        {
          "quality": "excellent|good|fair|poor|no_answer",
          "confidence": "high|medium|low",
          "relevance": "highly_relevant|relevant|partially_relevant|irrelevant",
          "key_points": ["point1", "point2"],
          "response_type": "complete_answer|partial_answer|dont_know|off_topic|unclear",
          "voice_tone": "confident|nervous|enthusiastic|monotone|professional|casual",
          "communication_clarity": "very_clear|clear|somewhat_clear|unclear",
          "technical_accuracy": "accurate|mostly_accurate|partially_accurate|inaccurate|not_applicable",
          "depth_of_knowledge": "expert|proficient|basic|limited|none"
        }
      `

      const result = await this.model.generateContent(analysisPrompt)
      const response = await result.response
      let responseText = response.text().trim()

      // Clean up any markdown formatting that might be present
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

      // Try to parse the JSON
      const parsedResponse = JSON.parse(responseText)
      return parsedResponse
    } catch (error) {
      console.log("Error analyzing response:", error)
      console.log("Raw response text:", error.message)
      return {
        quality: "fair",
        confidence: "medium",
        relevance: "relevant",
        key_points: ["response provided"],
        response_type: "complete_answer",
        voice_tone: "professional",
        communication_clarity: "clear",
        technical_accuracy: "mostly_accurate",
        depth_of_knowledge: "proficient"
      }
    }
  }

  isHelpRequest(prompt) {
    const helpKeywords = [
      'help', 'hint', 'explain', 'clarify', 'confused', 'understand',
      'what do you mean', 'can you help', 'i need help', 'stuck',
      'don\'t know', 'not sure', 'can you give me', 'guide me'
    ]

    const lowerPrompt = prompt.toLowerCase()
    return helpKeywords.some(keyword => lowerPrompt.includes(keyword))
  }

  async generateHelpResponse(prompt, context) {
    const helpPrompt = `
      The user is asking for help during an interview. Be supportive and provide guidance.

      Context: ${JSON.stringify(context, null, 2)}
      User's help request: "${prompt}"

      IMPORTANT: Your response will be read aloud by text-to-speech, so:
      - DO NOT use markdown formatting (**, *, #, etc.)
      - DO NOT use special characters or symbols
      - Write in plain, spoken English only
      - Use natural speech patterns

      Provide helpful guidance:
      - Give a hint or direction without giving away the full answer
      - Be encouraging and supportive
      - Ask a leading question to guide their thinking
      - Keep it conversational and friendly
      - Make them feel comfortable asking for help
    `

    try {
      const result = await this.model.generateContent(helpPrompt)
      const response = await result.response
      return this.cleanTextForSpeech(response.text())
    } catch (error) {
      return "Of course! Let me help you think through this. What part would you like me to clarify?"
    }
  }

  cleanTextForSpeech(text) {
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

  async speak(text, canBeInterrupted = true) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.synthesis) {
          reject(new Error("Speech synthesis not available"))
          return
        }

        // Stop any ongoing speech
        this.stopSpeaking()

        this.currentUtterance = new SpeechSynthesisUtterance(text)
        this.currentUtterance.rate = 0.9
        this.currentUtterance.pitch = 1
        this.currentUtterance.volume = 1.0  // Ensure maximum volume
        this.canBeInterrupted = canBeInterrupted

        console.log("Created utterance with volume:", this.currentUtterance.volume)

        // Try to use a specific voice if available
        const voices = this.synthesis.getVoices()
        if (voices.length > 0) {
          // Prefer English voices
          const englishVoice = voices.find(voice => voice.lang.startsWith('en'))
          if (englishVoice) {
            this.currentUtterance.voice = englishVoice
            console.log("Using voice:", englishVoice.name)
          }
        } else {
          // If no voices available, wait a bit and try again
          console.log("No voices available, waiting for voices to load...")
          setTimeout(() => {
            const retryVoices = this.synthesis.getVoices()
            if (retryVoices.length > 0) {
              const englishVoice = retryVoices.find(voice => voice.lang.startsWith('en'))
              if (englishVoice) {
                this.currentUtterance.voice = englishVoice
                console.log("Using voice after retry:", englishVoice.name)
              }
            }
          }, 100)
        }

        // Set a more generous timeout based on text length
        const timeoutDuration = Math.max(text.length * 100, 10000) // At least 10 seconds

        const timeout = setTimeout(() => {
          console.log("Speech timeout reached")
          this.stopSpeaking()
          resolve()
        }, timeoutDuration)

        this.currentUtterance.onstart = () => {
          this.isSpeaking = true
          console.log("Speech started:", text.substring(0, 50) + "...")
        }

        this.currentUtterance.onend = () => {
          console.log("Speech ended normally")
          clearTimeout(timeout)
          this.isSpeaking = false
          this.currentUtterance = null
          resolve()
        }

        this.currentUtterance.onerror = (event) => {
          console.log("Speech error:", event.error)
          clearTimeout(timeout)
          this.isSpeaking = false
          this.currentUtterance = null

          // Don't treat "interrupted" as an error - it's normal when stopping speech
          if (event.error === "interrupted" || event.error === "canceled") {
            resolve()
          } else {
            reject(new Error(`Speech synthesis error: ${event.error}`))
          }
        }

        // Ensure synthesis is ready
        if (this.synthesis.paused) {
          this.synthesis.resume()
        }

        console.log("About to speak:", text.substring(0, 50) + "...")
        console.log("Available voices:", this.synthesis.getVoices().length)

        try {
          this.synthesis.speak(this.currentUtterance)
        } catch (speakError) {
          console.log("Error calling speak:", speakError)
          // Try again after a short delay
          setTimeout(() => {
            try {
              this.synthesis.speak(this.currentUtterance)
            } catch (retryError) {
              console.log("Retry speak failed:", retryError)
              reject(retryError)
            }
          }, 100)
        }
      } catch (error) {
        console.log("Error in speak method:", error)
        this.isSpeaking = false
        this.currentUtterance = null
        reject(error)
      }
    })
  }

  interruptSpeech() {
    if (this.isSpeaking && this.canBeInterrupted) {
      this.stopSpeaking()
      if (this.onInterruptCallback) {
        this.onInterruptCallback()
      }
      return true
    }
    return false
  }

  stopSpeaking() {
    if (this.isSpeaking && this.currentUtterance && this.synthesis) {
      this.synthesis.cancel()
      this.isSpeaking = false
      this.currentUtterance = null
    }
  }

  async startListening() {
    return new Promise(async (resolve, reject) => {
      if (!this.recognition) {
        reject(new Error("Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari."))
        return
      }

      if (this.isListening) {
        reject(new Error("Already listening"))
        return
      }

      // Stop any ongoing speech before listening
      this.stopSpeaking()

      // Wait a bit for speech to fully stop
      setTimeout(() => {
        this.isListening = true
        let finalTranscript = ""
        let interimTranscript = ""

        this.recognition.onresult = (event) => {
          let interim = ""
          let final = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              final += transcript
            } else {
              interim += transcript
            }
          }

          finalTranscript += final
          interimTranscript = interim

          // Reset silence timer on speech
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer)
          }

          // If we have final results and voice activity detection is enabled
          if (final && this.voiceActivityDetection) {
            // Set a timer to detect end of speech
            this.silenceTimer = setTimeout(() => {
              if (finalTranscript.trim()) {
                console.log("Speech recognized:", finalTranscript)
                this.isListening = false
                this.recognition.stop()
                resolve(finalTranscript)
              }
            }, 1500) // Wait 1.5 seconds of silence
          }
        }

        this.recognition.onerror = (event) => {
          console.log("Speech recognition error:", event.error)
          this.isListening = false
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer)
          }

          // Handle different error types with appropriate responses
          switch (event.error) {
            case 'network':
              // For network errors, try to restart recognition automatically
              console.log("Network error detected, attempting to restart recognition...")
              setTimeout(() => {
                if (!this.isListening) {
                  try {
                    this.recognition.start()
                    this.isListening = true
                    console.log("Speech recognition restarted successfully")
                  } catch (restartError) {
                    console.log("Failed to restart recognition:", restartError)
                    reject(new Error("Network connection unstable. Please check your internet and try again."))
                  }
                }
              }, 1000)
              return // Don't reject immediately for network errors

            case 'not-allowed':
              reject(new Error("Microphone access denied. Please click the microphone icon in your browser's address bar and allow access, then try again."))
              break

            case 'no-speech':
              // For no-speech, resolve with empty string instead of error
              console.log("No speech detected, resolving with empty response")
              resolve("")
              return

            case 'aborted':
              // Recognition was aborted, this is normal when stopping
              console.log("Speech recognition was aborted")
              resolve("")
              return

            case 'service-not-allowed':
              reject(new Error("Speech recognition service not allowed. Please check your browser settings."))
              break

            case 'bad-grammar':
              reject(new Error("Speech recognition grammar error. Please try speaking again."))
              break

            default:
              reject(new Error(`Speech recognition error: ${event.error}`))
          }
        }

        this.recognition.onend = () => {
          this.isListening = false
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer)
          }
          // If we have a transcript, resolve with it
          if (finalTranscript.trim()) {
            resolve(finalTranscript)
          }
        }

        try {
          this.recognition.start()
        } catch (error) {
          this.isListening = false
          console.log("Error starting speech recognition:", error)
          reject(new Error("Failed to start speech recognition. Please ensure your microphone is connected and try again."))
        }
      }, 500) // Wait 500ms for speech to stop
    })
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  getIsListening() {
    return this.isListening
  }

  getIsSpeaking() {
    return this.isSpeaking
  }

  cleanup() {
    this.stopSpeaking()
    this.stopListening()
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
    }
  }

  // Utility methods for better conversation flow
  async startConversationalListening(onPartialTranscript) {
    return new Promise(async (resolve, reject) => {
      if (!this.recognition) {
        reject(new Error("Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari."))
        return
      }

      if (this.isListening) {
        this.stopListening()
      }

      this.stopSpeaking()

      setTimeout(() => {
        this.isListening = true
        let finalTranscript = ""

        this.recognition.onresult = (event) => {
          let interim = ""
          let final = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              final += transcript
            } else {
              interim += transcript
            }
          }

          finalTranscript += final

          // Call partial transcript callback for real-time feedback
          if (onPartialTranscript && (final || interim)) {
            onPartialTranscript(finalTranscript + interim)
          }

          if (final) {
            if (this.silenceTimer) {
              clearTimeout(this.silenceTimer)
            }

            this.silenceTimer = setTimeout(() => {
              if (finalTranscript.trim()) {
                this.isListening = false
                this.recognition.stop()
                resolve(finalTranscript.trim())
              }
            }, 2000) // 2 seconds of silence to end
          }
        }

        this.recognition.onerror = (event) => {
          console.log("Speech recognition error:", event.error)
          this.isListening = false
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer)
          }

          // Handle different error types with appropriate responses
          switch (event.error) {
            case 'network':
              // For network errors, try to restart recognition automatically
              console.log("Network error detected, attempting to restart recognition...")
              setTimeout(() => {
                if (!this.isListening) {
                  try {
                    this.recognition.start()
                    this.isListening = true
                    console.log("Speech recognition restarted successfully")
                  } catch (restartError) {
                    console.log("Failed to restart recognition:", restartError)
                    reject(new Error("Network connection unstable. Please check your internet and try again."))
                  }
                }
              }, 1000)
              return // Don't reject immediately for network errors

            case 'not-allowed':
              reject(new Error("Microphone access denied. Please click the microphone icon in your browser's address bar and allow access, then try again."))
              break

            case 'no-speech':
              // For no-speech, resolve with empty string instead of error
              console.log("No speech detected, resolving with empty response")
              resolve("")
              return

            case 'aborted':
              // Recognition was aborted, this is normal when stopping
              console.log("Speech recognition was aborted")
              resolve("")
              return

            case 'service-not-allowed':
              reject(new Error("Speech recognition service not allowed. Please check your browser settings."))
              break

            default:
              reject(new Error(`Speech recognition error: ${event.error}`))
          }
        }

        this.recognition.onend = () => {
          this.isListening = false
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer)
          }
          if (finalTranscript.trim()) {
            resolve(finalTranscript.trim())
          }
        }

        try {
          this.recognition.start()
        } catch (error) {
          this.isListening = false
          console.log("Error starting conversational listening:", error)
          reject(new Error("Failed to start speech recognition. Please ensure your microphone is connected and try again."))
        }
      }, 300)
    })
  }

  // Cleanup method to properly stop all ongoing processes
  cleanup() {
    try {
      // Stop speech recognition
      if (this.recognition && this.isListening) {
        this.recognition.stop()
        this.isListening = false
      }

      // Stop speech synthesis
      if (this.synthesis && this.isSpeaking) {
        this.synthesis.cancel()
        this.isSpeaking = false
      }

      // Clear any timers
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer)
        this.silenceTimer = null
      }

      console.log("Voice service cleaned up successfully")
    } catch (error) {
      console.log("Error during voice service cleanup:", error)
    }
  }

  // Method to check if recognition is available
  isRecognitionAvailable() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  // Method to stop listening gracefully
  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop()
        this.isListening = false
        console.log("Speech recognition stopped")
      } catch (error) {
        console.log("Error stopping speech recognition:", error)
        this.isListening = false
      }
    }
  }
}
