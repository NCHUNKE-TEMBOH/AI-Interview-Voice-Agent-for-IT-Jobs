"use client"
import { InterviewDataContext } from '@/context/InterviewDataContext'
import { Loader2Icon, Mic, MicOff, Phone, PhoneOff, Timer, Volume2, VolumeX, HelpCircle, MessageCircle } from 'lucide-react';
import React, { useContext, useEffect, useState, useRef } from 'react'
import { toast } from 'sonner';
import TimerComponent from './_components/TimerComponent';
import axios from 'axios';
import { supabase } from '@/services/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import { AnimatedAIOrb } from '@/components/animated-ai-orb';
import { GeminiVoiceService } from '@/lib/gemini-voice';
import { generateInterviewQuestion } from '@/lib/ai-services';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

function StartInterview() {
    const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext);
    const { interview_id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // New Kamikaz Voice Agent States
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [partialTranscript, setPartialTranscript] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState("");
    const [questionCount, setQuestionCount] = useState(0);
    const [askedQuestions, setAskedQuestions] = useState([]);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [responseAnalytics, setResponseAnalytics] = useState([]);
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

    // Text input states
    const [textResponse, setTextResponse] = useState("");
    const [showTextInput, setShowTextInput] = useState(false);
    const [inputMode, setInputMode] = useState("voice"); // "voice" or "text"

    // Interview control states
    const [isInterviewEnding, setIsInterviewEnding] = useState(false);
    const [microphonePermission, setMicrophonePermission] = useState('granted');
    const [errorMessage, setErrorMessage] = useState("");
    const [showError, setShowError] = useState(false);
    const [interviewRecord, setInterviewRecord] = useState(null);

    const voiceServiceRef = useRef(null);
    const maxQuestions = 5;

    // Interview timing states
    const [interviewDuration, setInterviewDuration] = useState(0); // in minutes
    const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
    const [interviewStartTime, setInterviewStartTime] = useState(null);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (interviewInfo) {
            initializeVoiceService();
            // Set interview duration from interview data (default 30 minutes)
            const duration = interviewInfo?.interviewData?.duration || 30;
            setInterviewDuration(duration);
            setTimeRemaining(duration * 60); // Convert to seconds
        }

        return () => {
            if (voiceServiceRef.current) {
                voiceServiceRef.current.cleanup();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    }, [interviewInfo])

    // Timer effect
    useEffect(() => {
        if (isConnected && !isTimeUp && timeRemaining > 0) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        setIsTimeUp(true);
                        handleTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    }, [isConnected, isTimeUp, timeRemaining])

    const initializeVoiceService = () => {
        // Initialize voice service with enhanced features
        voiceServiceRef.current = new GeminiVoiceService();
        voiceServiceRef.current.enableVoiceActivityDetection(true);
        voiceServiceRef.current.setInterruptCallback(() => {
            console.log("AI speech was interrupted by user");
            setIsSpeaking(false);
        });

        // Set microphone permission to granted by default
        setMicrophonePermission('granted');
    }



    const createInterviewRecord = async () => {
        try {
            // Don't create any record initially - just track locally
            // The original VAPI system only creates records when feedback is generated
            const localRecord = {
                interview_id: interview_id,
                username: interviewInfo?.userName,
                useremail: interviewInfo?.userEmail,
                status: "in_progress",
                started_at: new Date().toISOString(),
                conversation_history: []
            };

            setInterviewRecord(localRecord);
            return localRecord;
        } catch (error) {
            console.log("Error creating interview record:", error);
            return null;
        }
    }

    const updateInterviewRecord = async (updates) => {
        if (!interviewRecord) return;

        try {
            // Just update local state - no database updates until final feedback
            setInterviewRecord(prev => ({
                ...prev,
                ...updates,
                updated_at: new Date().toISOString()
            }));
        } catch (error) {
            console.log("Error updating interview record:", error);
        }
    }

    const handleTimeUp = async () => {
        if (!voiceServiceRef.current) return;

        try {
            setIsSpeaking(true);
            const userName = interviewInfo?.userName || "Candidate";

            const timeUpMessage = `${userName}, I'm sorry but our allocated interview time has come to an end. Thank you for your responses today. We'll now proceed to evaluate your performance and provide you with detailed feedback.`;

            await voiceServiceRef.current.speak(timeUpMessage);
            setIsSpeaking(false);

            // End interview due to time
            await endInterview(false, "time_up");
        } catch (error) {
            console.log("Error handling time up:", error);
            await endInterview(false, "time_up");
        }
    }

    const startInterview = async () => {
        if (!voiceServiceRef.current) return;

        setIsConnected(true);
        setIsSpeaking(true);
        setInterviewStartTime(new Date());

        // Create interview record
        await createInterviewRecord();

        try {
            // Get job position and user name
            const jobPosition = interviewInfo?.interviewData?.jobPosition || "Software Engineer";
            const userName = interviewInfo?.userName || "Candidate";
            const interviewType = interviewInfo?.interviewData?.type || "technical";

            // Personalized welcome message with time information
            const welcomeMessage = `Hello ${userName}! Welcome to your ${interviewType} interview for the ${jobPosition} position.

I'm your AI interviewer, and I'm excited to get to know you better today. We have ${interviewDuration} minutes allocated for this interview, and I'll be asking you ${maxQuestions} questions to assess your skills and experience.

I'll listen carefully to your responses and provide feedback as we go. Please speak clearly and take your time to think through your answers. Feel free to ask for clarification if needed.

Are you ready to begin? Let's start with our first question.`;

            await voiceServiceRef.current.speak(welcomeMessage);

            // Generate and ask first question
            await askNextQuestion();
        } catch (error) {
            console.log("Error starting interview:", error);
            setIsSpeaking(false);
        }
    }

    const askNextQuestion = async () => {
        if (!voiceServiceRef.current || questionCount >= maxQuestions || isInterviewEnding) {
            if (!isInterviewEnding) {
                await endInterview();
            }
            return;
        }

        try {
            setIsSpeaking(true);

            // Get interview type for question generation
            const interviewType = interviewInfo?.interviewData?.type || "technical";
            const difficulty = "medium"; // Default difficulty

            // Generate question using AI or use predefined questions
            let question;
            const questions = interviewInfo?.interviewData?.questionList;

            // Use the current question count to get the next question
            const nextQuestionIndex = questionCount;

            if (questions && Array.isArray(questions) && questions.length > nextQuestionIndex) {
                // Use predefined questions if available
                const questionItem = questions[nextQuestionIndex];
                question = typeof questionItem === 'string' ? questionItem : questionItem?.question || questionItem?.text || "Tell me about yourself.";
            } else {
                // Generate AI question based on interview context
                const jobPosition = interviewInfo?.interviewData?.jobPosition || "Software Engineer";
                const requiredSkills = interviewInfo?.interviewData?.requiredSkills || "Programming, Problem-solving";

                question = await generateInterviewQuestion(interviewType, difficulty, askedQuestions, {
                    jobPosition,
                    requiredSkills,
                    questionNumber: nextQuestionIndex + 1,
                    totalQuestions: maxQuestions
                });
            }

            // Ensure we have a valid question
            if (!question || question.trim() === "") {
                question = `Question ${nextQuestionIndex + 1}: Tell me about your experience with ${interviewType} challenges.`;
            }

            // Update current question and add to asked questions (prevent duplicates)
            setCurrentQuestion(question);
            setAskedQuestions(prev => {
                if (!prev.includes(question)) {
                    return [...prev, question];
                }
                return prev;
            });

            // Add question to conversation history
            setConversationHistory(prev => [...prev, {
                speaker: 'ai',
                message: question,
                timestamp: new Date()
            }]);

            // Ask the question conversationally
            await voiceServiceRef.current.speak(question, true); // Can be interrupted
            setIsSpeaking(false);

            // Update interview record (don't increment count until user responds)
            await updateInterviewRecord({
                current_question: question,
            });

            // Start conversational listening for natural flow
            setTimeout(() => {
                startConversationalListening();
            }, 1000);
        } catch (error) {
            console.log("Error asking question:", error);
            setIsSpeaking(false);
        }
    }

    const startConversationalListening = async () => {
        if (!voiceServiceRef.current || isListening) return;

        try {
            setIsListening(true);
            setIsWaitingForResponse(true);
            setPartialTranscript("");
            setShowError(false);

            const response = await voiceServiceRef.current.startConversationalListening((partial) => {
                setPartialTranscript(partial);
            });

            setTranscript(response);
            setPartialTranscript("");
            setIsListening(false);

            if (response.trim()) {
                await processResponse(response);
            }
        } catch (error) {
            console.log("Error in conversational listening:", error);
            setIsListening(false);
            setIsWaitingForResponse(false);

            // Show user-friendly error message
            const errorMsg = error instanceof Error ? error.message : "An error occurred with speech recognition";
            setErrorMessage(errorMsg);
            setShowError(true);

            // Hide error after 5 seconds
            setTimeout(() => setShowError(false), 5000);
        }
    }

    const handleTextSubmit = async () => {
        if (!textResponse.trim()) return;

        // Process the text response the same way as voice response
        await processResponse(textResponse.trim());

        // Clear the text input and hide it
        setTextResponse("");
        setShowTextInput(false);
        setInputMode("voice");
    };

    const toggleInputMode = () => {
        if (inputMode === "voice") {
            setInputMode("text");
            setShowTextInput(true);
            // Stop listening if currently listening
            if (isListening && voiceServiceRef.current) {
                voiceServiceRef.current.stopListening();
                setIsListening(false);
            }
        } else {
            setInputMode("voice");
            setShowTextInput(false);
            setTextResponse("");
            // Start listening again
            if (!isListening) {
                startConversationalListening();
            }
        }
    };

    const processResponse = async (response) => {
        if (!voiceServiceRef.current) return;

        try {
            setIsSpeaking(true);
            setIsWaitingForResponse(false);

            // Add user response to conversation history
            setConversationHistory(prev => [...prev, {
                speaker: 'user',
                message: response,
                timestamp: new Date(),
                inputMethod: inputMode // Track how the response was provided
            }]);

            // Generate conversational AI response
            const context = {
                company: interviewInfo?.interviewData?.jobPosition || "Company",
                role: interviewInfo?.interviewData?.jobPosition || "Role",
                type: interviewInfo?.interviewData?.type || "technical",
                difficulty: "medium",
                currentQuestion,
                questionCount,
                maxQuestions,
                conversationHistory,
                userName: interviewInfo?.userName || "Candidate"
            };

            const aiResponse = await voiceServiceRef.current.generateConversationalResponse(response, context);

            // Store response analytics for detailed feedback
            const responseAnalysis = {
                question: currentQuestion,
                response: response,
                ai_feedback: aiResponse,
                question_number: questionCount,
                timestamp: new Date().toISOString(),
                // Additional analytics will be captured by the AI analysis
            };

            setResponseAnalytics(prev => [...prev, responseAnalysis]);

            // Add AI response to conversation history
            setConversationHistory(prev => [...prev, {
                speaker: 'ai',
                message: aiResponse,
                timestamp: new Date(),
                analysis: responseAnalysis
            }]);

            await voiceServiceRef.current.speak(aiResponse, true); // Can be interrupted
            setIsSpeaking(false);

            // Update local interview record with conversation history
            try {
                await updateInterviewRecord({
                    conversation_history: conversationHistory,
                    questions_asked: questionCount,
                    current_question: currentQuestion,
                    last_response: response,
                    last_ai_feedback: aiResponse
                });
            } catch (dbError) {
                console.log("Error updating local record:", dbError);
            }

            // Increment question count after user responds
            const newQuestionCount = questionCount + 1;
            setQuestionCount(newQuestionCount);

            // Update interview record with new count
            await updateInterviewRecord({
                questions_asked: newQuestionCount,
            });

            // Wait for AI response to complete, then move to next question
            setTimeout(() => {
                if (newQuestionCount < maxQuestions && !isTimeUp && !isInterviewEnding) {
                    askNextQuestion();
                } else if (!isInterviewEnding) {
                    endInterview();
                }
            }, 3000); // Give more time for natural conversation flow
        } catch (error) {
            console.log("Error processing response:", error);
            setIsSpeaking(false);
        }
    }

    const endInterview = async (isEarlyEnd = false, reason = "completed") => {
        if (!voiceServiceRef.current) return;

        try {
            setIsSpeaking(true);

            // Calculate interview duration
            const endTime = new Date();
            const actualDuration = interviewStartTime ?
                Math.round((endTime - interviewStartTime) / (1000 * 60)) : 0;

            const userName = interviewInfo?.userName || "Candidate";
            const jobPosition = interviewInfo?.interviewData?.jobPosition || "this position";

            let goodbyeMessage = "";

            if (reason === "time_up") {
                goodbyeMessage = `${userName}, that concludes our interview as we've reached the allocated time limit.

Thank you for your responses today. I've gathered valuable insights about your background and capabilities during our ${actualDuration} minute conversation.

Your interview performance will now be evaluated, and you'll receive detailed feedback shortly. This will include your overall score and specific areas of strength and improvement.

Thank you for your time today.`;
            } else if (isEarlyEnd) {
                goodbyeMessage = `${userName}, I understand you'd like to conclude the interview at this point.

Thank you for the time you've given us today. We covered ${questionCount} questions in our ${actualDuration} minute session, and I appreciate your responses.

Your interview performance will be evaluated based on what we discussed, and you'll receive feedback on your responses and overall presentation.

Thank you for participating in this interview process.`;
            } else {
                goodbyeMessage = `${userName}, that brings us to the end of our interview.

We've completed all ${maxQuestions} questions in our ${actualDuration} minute session. Thank you for your thoughtful responses and for taking the time to speak with us today.

Your interview performance will now be evaluated. You'll receive a detailed assessment including your overall score, response quality, and areas for potential improvement.

This concludes our interview. Thank you for your time.`;
            }

            await voiceServiceRef.current.speak(goodbyeMessage);

            // Calculate final score based on multiple factors
            const completionRate = (questionCount / maxQuestions) * 100;
            const timeEfficiency = actualDuration > 0 ? Math.min((actualDuration / interviewDuration) * 100, 100) : 50;
            const baseScore = (completionRate * 0.7) + (timeEfficiency * 0.3);
            const finalScore = Math.min(Math.max(baseScore, 20), 95); // Keep between 20-95

            // Update local interview record
            await updateInterviewRecord({
                status: "completed",
                score: Math.round(finalScore),
                completed_at: new Date().toISOString(),
                actual_duration: actualDuration,
                completion_reason: reason,
                final_feedback: reason === "time_up" ? "Interview completed - time limit reached" :
                    isEarlyEnd ? "Interview ended early by candidate" : "Interview completed successfully",
                conversation_history: conversationHistory,
                questions_completed: questionCount,
                total_questions: maxQuestions
            });

            setIsSpeaking(false);

            // Generate final feedback using existing system
            await GenerateFeedback();
        } catch (error) {
            console.log("Error ending interview:", error);
            setIsSpeaking(false);
            router.push('/interview/' + interview_id + "/completed");
        }
    }

    const GenerateFeedback = async () => {
        setLoading(true);

        try {
            // Create conversation string from conversation history
            const conversation = JSON.stringify(conversationHistory);

            if (!conversation || conversationHistory.length === 0) {
                // If no conversation, create a basic feedback
                const basicFeedback = {
                    overallScore: 50,
                    feedback: "Interview was too short to provide detailed feedback.",
                    strengths: ["Participated in the interview"],
                    improvements: ["Complete more questions for better assessment"],
                    recommendation: "Practice more interview questions"
                };

                // Save to database using original structure
                await supabase.from('interview-feedback').insert([{
                    username: interviewInfo?.userName,
                    useremail: interviewInfo?.userEmail,
                    interview_id: interview_id,
                    feedback: basicFeedback,
                    recommended: false
                }]);

                router.replace('/interview/' + interview_id + "/completed");
                setLoading(false);
                return;
            }

            // Convert conversation history to VAPI format for compatibility
            let conversationData;

            if (!conversationHistory || conversationHistory.length === 0) {
                // Create default conversation if none exists
                conversationData = {
                    messages: [
                        {
                            role: "assistant",
                            content: "Thank you for participating in this interview. We'll analyze your responses and get back to you soon."
                        },
                        {
                            role: "user",
                            content: "Thank you for the opportunity."
                        }
                    ]
                };
            } else {
                // Convert our conversation history to VAPI message format
                const messages = [];
                conversationHistory.forEach(item => {
                    messages.push({
                        role: item.speaker === 'ai' ? 'assistant' : 'user',
                        content: item.message
                    });
                });

                conversationData = { messages };
            }

            // Use the same API call structure as original VAPI implementation with enhanced analytics
            const result = await axios.post('/api/ai-feedback', {
                conversation: conversationData,
                jobTitle: interviewInfo?.interviewData?.jobPosition || 'Job Position',
                jobDescription: interviewInfo?.interviewData?.jobDescription || 'A professional role requiring strong skills.',
                requiredSkills: interviewInfo?.interviewData?.requiredSkills || 'Communication, problem-solving, teamwork',
                companyCriteria: interviewInfo?.interviewData?.companyCriteria || 'Looking for qualified candidates',
                // Enhanced analytics for better feedback
                responseAnalytics: responseAnalytics,
                interviewMetrics: {
                    questionsCompleted: questionCount,
                    totalQuestions: maxQuestions,
                    actualDuration: interviewStartTime ? Math.round((new Date() - interviewStartTime) / (1000 * 60)) : 0,
                    completionRate: (questionCount / maxQuestions) * 100
                }
            });

            console.log(result?.data);
            const Content = result.data.content;
            const FINAL_CONTENT = Content.replace('```json', '').replace('```', '');
            console.log(FINAL_CONTENT);

            // Save to Database using original structure
            const { data, error } = await supabase
                .from('interview-feedback')
                .insert([{
                    username: interviewInfo?.userName,
                    useremail: interviewInfo?.userEmail,
                    interview_id: interview_id,
                    feedback: JSON.parse(FINAL_CONTENT),
                    recommended: false
                }])
                .select();

            console.log(data);


            router.replace('/interview/' + interview_id + "/completed");
        } catch (error) {
            console.log("Error generating feedback:", error);
            router.replace('/interview/' + interview_id + "/completed");
        } finally {
            setLoading(false);
        }
    }

    const handleAskForHelp = async () => {
        if (!voiceServiceRef.current) return;

        try {
            setIsSpeaking(true);

            const helpContext = {
                company: interviewInfo?.interviewData?.jobPosition || "Company",
                role: interviewInfo?.interviewData?.jobPosition || "Role",
                type: interviewInfo?.interviewData?.type || "technical",
                difficulty: "medium",
                currentQuestion,
                questionCount,
                conversationHistory,
                userName: interviewInfo?.userName || "Candidate"
            };

            const helpResponse = await voiceServiceRef.current.generateConversationalResponse(
                "I need help with this question",
                helpContext
            );

            // Add help request to conversation history
            setConversationHistory(prev => [...prev,
            {
                speaker: 'user',
                message: 'Asked for help',
                timestamp: new Date()
            },
            {
                speaker: 'ai',
                message: helpResponse,
                timestamp: new Date()
            }
            ]);

            await voiceServiceRef.current.speak(helpResponse, true);
            setIsSpeaking(false);

            // Continue listening after help
            setTimeout(() => {
                startConversationalListening();
            }, 1000);
        } catch (error) {
            console.log("Error providing help:", error);
            setIsSpeaking(false);
        }
    }

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (voiceServiceRef.current) {
            if (!isMuted) {
                voiceServiceRef.current.stopSpeaking();
            }
        }
    }

    const stopListening = () => {
        if (voiceServiceRef.current) {
            voiceServiceRef.current.stopListening();
            setIsListening(false);
        }
    }

    const handleEndCall = async () => {
        // Set flag to prevent further questions
        setIsInterviewEnding(true);

        // Clean up voice service
        if (voiceServiceRef.current) {
            voiceServiceRef.current.cleanup();
        }

        // End the interview
        await endInterview(true, "user_ended");
    }

    // Format time remaining for display
    const formatTimeRemaining = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className='p-20 lg:px-48 xl:px-56'>
            <h2 className='font-bold text-xl flex justify-between'>AI Interview Session
                <span className='flex gap-2 items-center'>
                    <Timer />
                    {isConnected ? (
                        <div className={`text-sm ${timeRemaining < 300 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                            Time Remaining: {formatTimeRemaining(timeRemaining)}
                        </div>
                    ) : (
                        <TimerComponent start={isConnected} />
                    )}
                </span>
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-7 mt-5'>
                {/* AI Interviewer Side */}
                <div className='bg-white h-[400px] rounded-lg border flex relative flex-col gap-3 items-center justify-center'>
                    <AnimatedAIOrb
                        isListening={isListening}
                        isSpeaking={isSpeaking}
                        isConnected={isConnected}
                        size={120}
                    />
                    <h2>AI Interviewer</h2>

                    {/* Interview Info */}
                    {interviewInfo?.interviewData && (
                        <div className="flex flex-wrap justify-center gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                                {interviewInfo.interviewData.jobPosition}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                {interviewInfo.interviewData.type || "Technical"}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* User Side */}
                <div className='bg-white h-[400px] rounded-lg border flex flex-col gap-3 items-center justify-center'>
                    <div className='relative'>
                        {isListening && <span className="absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping" />}
                        <h2 className='text-2xl text-white bg-primary p-3 rounded-full px-5'>
                            {interviewInfo?.userName?.[0] || "U"}
                        </h2>
                    </div>
                    <h2>{interviewInfo?.userName || "User"}</h2>

                    {/* Status Display */}
                    <div className="text-center text-sm text-gray-600">
                        {!isConnected && "Ready to start"}
                        {isConnected && isSpeaking && "AI is speaking..."}
                        {isConnected && isListening && "Listening..."}
                        {isConnected && isWaitingForResponse && "Processing your response..."}
                        {isConnected && !isSpeaking && !isListening && !isWaitingForResponse && "Ready for next response"}
                        {isTimeUp && "Interview time completed"}
                    </div>

                    {/* Question Counter and Progress */}
                    {isConnected && (
                        <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">
                                Question {questionCount} of {maxQuestions}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(questionCount / maxQuestions) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Time Warning */}
            {isConnected && timeRemaining <= 300 && timeRemaining > 0 && (
                <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                    <p className="text-sm font-medium">⏰ Time Warning: Only {formatTimeRemaining(timeRemaining)} remaining!</p>
                </div>
            )}

            {/* Error Message */}


            {/* Conversation Display */}
            {isConnected && conversationHistory.length > 0 && (
                <div className="mt-4 bg-white border rounded-lg p-4 max-h-60 overflow-y-auto">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Conversation</h3>
                    <div className="space-y-2">
                        {conversationHistory.slice(-6).map((item, index) => (
                            <div key={index} className={`p-2 rounded text-sm ${item.speaker === 'ai'
                                ? 'bg-blue-50 border-l-4 border-blue-400'
                                : 'bg-green-50 border-l-4 border-green-400'
                                }`}>
                                <div className="flex justify-between items-start">
                                    <span className="font-medium text-xs text-gray-600">
                                        {item.speaker === 'ai' ? 'AI Interviewer' : 'You'}
                                        {item.inputMethod && ` (${item.inputMethod})`}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="mt-1 text-gray-800">{item.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Live Text Input Display */}
            {inputMode === 'text' && textResponse.trim() && (
                <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-3 rounded">
                    <div className="flex justify-between items-start">
                        <span className="font-medium text-xs text-gray-600">You (typing)</span>
                        <span className="text-xs text-gray-400">Live preview</span>
                    </div>
                    <p className="mt-1 text-gray-800 text-sm">{textResponse}</p>
                </div>
            )}

            {/* Transcript Display */}
            {(partialTranscript || transcript) && (
                <div className="mt-4 bg-gray-100 p-3 rounded-lg">
                    {partialTranscript && (
                        <p className="text-gray-600 text-sm italic">You're saying: "{partialTranscript}"</p>
                    )}
                    {transcript && (
                        <p className="text-gray-800 text-sm">You said: "{transcript}"</p>
                    )}
                </div>
            )}

            {/* Error Display */}
            {showError && (
                <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p className="text-sm">{errorMessage}</p>
                </div>
            )}

            {/* Current Question Display */}
            {currentQuestion && isConnected && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-blue-800 font-medium mb-2">Current Question:</h3>
                    <p className="text-blue-700 text-sm">{currentQuestion}</p>
                </div>
            )}

            {/* Controls */}
            <div className='flex items-center gap-5 justify-center mt-7'>
                {!isConnected ? (
                    <Button
                        onClick={startInterview}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <Phone className="w-5 h-5 mr-2" />
                        {loading ? <Loader2Icon className='animate-spin mr-2' /> : null}
                        Start Interview
                    </Button>
                ) : (
                    <>
                        {/* Main conversation controls */}
                        <Button
                            onClick={isListening ? stopListening : startConversationalListening}
                            disabled={isSpeaking}
                            className={`${isListening ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                                } text-white px-6 py-3 rounded-full transition-all`}
                            title={isListening ? "Stop listening" : "Start talking"}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </Button>

                        <Button
                            onClick={toggleMute}
                            className={`${isMuted ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"
                                } text-white px-6 py-3 rounded-full`}
                            title={isMuted ? "Unmute AI" : "Mute AI"}
                        >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </Button>

                        <Button
                            onClick={toggleInputMode}
                            className={`${inputMode === 'text' ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"
                                } text-white px-4 py-3 rounded-full`}
                            title={inputMode === 'voice' ? 'Switch to text input' : 'Switch to voice input'}
                        >
                            <MessageCircle className="w-5 h-5" />
                        </Button>

                        <Button
                            onClick={handleAskForHelp}
                            disabled={isSpeaking}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-full"
                            title="Ask for help with current question"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </Button>

                        {!loading ? (
                            <Button
                                onClick={handleEndCall}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full"
                                title="End interview"
                            >
                                <PhoneOff className="w-5 h-5" />
                            </Button>
                        ) : (
                            <Loader2Icon className='animate-spin text-gray-500' />
                        )}

                        {isSpeaking && (
                            <Button
                                onClick={() => voiceServiceRef.current?.interruptSpeech()}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full text-sm"
                                title="Interrupt AI to speak"
                            >
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Interrupt
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* Text Input Box */}
            {showTextInput && isConnected && (
                <div className="mt-6 max-w-2xl mx-auto">
                    <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type your response:
                        </label>
                        <textarea
                            value={textResponse}
                            onChange={(e) => setTextResponse(e.target.value)}
                            placeholder="Type your answer here..."
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                    handleTextSubmit();
                                }
                            }}
                            autoFocus
                        />
                        {/* Live preview of typed text */}
                        {textResponse.trim() && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                <strong>Preview:</strong> {textResponse}
                            </div>
                        )}
                        <div className="flex justify-between items-center mt-3">
                            <span className="text-xs text-gray-500">
                                Press Ctrl+Enter to submit
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => {
                                        setTextResponse("");
                                        setShowTextInput(false);
                                        setInputMode("voice");
                                    }}
                                    variant="outline"
                                    className="px-4 py-2 text-sm"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleTextSubmit}
                                    disabled={!textResponse.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm"
                                >
                                    Submit Response
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h2 className='text-sm text-gray-400 text-center mt-5'>
                {!isConnected ? "Click 'Start Interview' to begin" :
                    inputMode === 'text' && showTextInput ? "Type your response above" :
                        "Interview in Progress..."}
            </h2>
        </div>
    )
}

export default StartInterview
