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
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showError, setShowError] = useState(false);
    const [microphonePermission, setMicrophonePermission] = useState('unknown');
    const [isRequestingPermission, setIsRequestingPermission] = useState(false);
    const [interviewRecord, setInterviewRecord] = useState(null);

    const voiceServiceRef = useRef(null);
    const maxQuestions = 5;

    useEffect(() => {
        if (interviewInfo) {
            initializeVoiceService();
        }

        return () => {
            if (voiceServiceRef.current) {
                voiceServiceRef.current.cleanup();
            }
        }
    }, [interviewInfo])

    const initializeVoiceService = () => {
        // Initialize voice service with enhanced features
        voiceServiceRef.current = new GeminiVoiceService();
        voiceServiceRef.current.enableVoiceActivityDetection(true);
        voiceServiceRef.current.setInterruptCallback(() => {
            console.log("AI speech was interrupted by user");
            setIsSpeaking(false);
        });

        // Check initial microphone permission status
        checkMicrophonePermission();
    }

    const checkMicrophonePermission = async () => {
        try {
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'microphone' });
                setMicrophonePermission(permission.state);

                // Listen for permission changes
                permission.onchange = () => {
                    setMicrophonePermission(permission.state);
                }
            }
        } catch (error) {
            console.log("Permission query not supported");
            setMicrophonePermission('unknown');
        }
    }

    const handleRequestMicrophonePermission = async () => {
        if (!voiceServiceRef.current) return;

        setIsRequestingPermission(true);
        setShowError(false);

        try {
            const hasPermission = await voiceServiceRef.current.requestMicrophonePermission();
            if (hasPermission) {
                setMicrophonePermission('granted');
                setErrorMessage("");
                setShowError(false);
            } else {
                setMicrophonePermission('denied');
                setErrorMessage("Microphone permission was denied. Please click the microphone icon in your browser's address bar to allow access.");
                setShowError(true);
            }
        } catch (error) {
            console.error("Error requesting microphone permission:", error);
            setMicrophonePermission('denied');
            setErrorMessage("Failed to request microphone permission. Please check your browser settings.");
            setShowError(true);
        } finally {
            setIsRequestingPermission(false);
        }
    }

    const createInterviewRecord = async () => {
        try {
            const { data, error } = await supabase
                .from("interviews")
                .insert({
                    user_id: interviewInfo?.userName,
                    company: interviewInfo?.interviewData?.jobPosition || "Company",
                    role: interviewInfo?.interviewData?.jobPosition || "Role",
                    type: interviewInfo?.interviewData?.type || "technical",
                    score: 0,
                    duration: 0,
                    status: "in_progress",
                    questions_count: 0,
                    topics: [interviewInfo?.interviewData?.type || "technical"],
                    feedback: "Interview in progress"
                })
                .select()
                .single()

            if (error) {
                console.error("Database error:", error);
                throw error;
            }

            setInterviewRecord(data);
            return data;
        } catch (error) {
            console.error("Error creating interview record:", error);
            // Continue without database record for now
            return null;
        }
    }

    const updateInterviewRecord = async (updates) => {
        if (!interviewRecord) return;

        try {
            const { error } = await supabase.from("interviews").update(updates).eq("id", interviewRecord.id);
            if (error) throw error;
        } catch (error) {
            console.error("Error updating interview record:", error);
        }
    }

    const startInterview = async () => {
        if (!voiceServiceRef.current) return;

        setIsConnected(true);
        setIsSpeaking(true);

        // Create interview record
        await createInterviewRecord();

        try {
            // Get job position and user name
            const jobPosition = interviewInfo?.interviewData?.jobPosition || "Software Engineer";
            const userName = interviewInfo?.userName || "Candidate";
            const interviewType = interviewInfo?.interviewData?.type || "technical";

            // Personalized welcome message
            const welcomeMessage = `Hello ${userName}! Welcome to your ${interviewType} interview for the ${jobPosition} position. 

I'm your AI interviewer, and I'm excited to get to know you better today. This will be a comprehensive interview where I'll ask you ${maxQuestions} questions to assess your skills and experience.

Here's how this will work: I'll ask you a question, then you can take your time to think and respond. Feel free to ask for clarification if needed. I'll be evaluating your technical knowledge, problem-solving approach, and communication skills.

Are you ready to begin? Let's start with our first question.`;

            await voiceServiceRef.current.speak(welcomeMessage);

            // Generate and ask first question
            await askNextQuestion();
        } catch (error) {
            console.error("Error starting interview:", error);
            setIsSpeaking(false);
        }
    }

    const askNextQuestion = async () => {
        if (!voiceServiceRef.current || questionCount >= maxQuestions) {
            await endInterview();
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

            if (questions && Array.isArray(questions) && questions.length > questionCount) {
                // Use predefined questions if available
                question = questions[questionCount]?.question || questions[questionCount];
            } else {
                // Generate AI question
                question = await generateInterviewQuestion(interviewType, difficulty, askedQuestions);
            }

            setCurrentQuestion(question);
            setAskedQuestions((prev) => [...prev, question]);

            // Add question to conversation history
            setConversationHistory(prev => [...prev, {
                speaker: 'ai',
                message: question,
                timestamp: new Date()
            }]);

            // Ask the question conversationally
            await voiceServiceRef.current.speak(question, true); // Can be interrupted
            setIsSpeaking(false);

            // Update question count
            const newCount = questionCount + 1;
            setQuestionCount(newCount);

            // Update interview record
            await updateInterviewRecord({
                questions_asked: newCount,
                current_question: question,
            });

            // Start conversational listening for natural flow
            setTimeout(() => {
                startConversationalListening();
            }, 1000);
        } catch (error) {
            console.error("Error asking question:", error);
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
            console.error("Error in conversational listening:", error);
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

    const processResponse = async (response) => {
        if (!voiceServiceRef.current) return;

        try {
            setIsSpeaking(true);
            setIsWaitingForResponse(false);

            // Add user response to conversation history
            setConversationHistory(prev => [...prev, {
                speaker: 'user',
                message: response,
                timestamp: new Date()
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

            // Add AI response to conversation history
            setConversationHistory(prev => [...prev, {
                speaker: 'ai',
                message: aiResponse,
                timestamp: new Date()
            }]);

            await voiceServiceRef.current.speak(aiResponse, true); // Can be interrupted
            setIsSpeaking(false);

            // Save response to database (using existing interview-feedback table)
            try {
                await supabase.from("interview-feedback").insert({
                    username: interviewInfo?.userName,
                    useremail: interviewInfo?.userEmail,
                    interview_id: interview_id,
                    feedback: {
                        question: currentQuestion,
                        response: response,
                        ai_feedback: aiResponse,
                        question_number: questionCount,
                        timestamp: new Date().toISOString()
                    },
                    recommended: false
                });
            } catch (dbError) {
                console.error("Error saving to database:", dbError);
                // Continue without saving to database
            }

            // Decide whether to ask next question or continue conversation
            // For now, let's continue listening for follow-up
            setTimeout(() => {
                if (questionCount < maxQuestions) {
                    // Ask if they want to continue or move to next question
                    askNextQuestion();
                } else {
                    endInterview();
                }
            }, 2000);
        } catch (error) {
            console.error("Error processing response:", error);
            setIsSpeaking(false);
        }
    }

    const endInterview = async (isEarlyEnd = false) => {
        if (!voiceServiceRef.current) return;

        try {
            setIsSpeaking(true);

            // Personalized goodbye message
            const userName = interviewInfo?.userName || "Candidate";
            const jobPosition = interviewInfo?.interviewData?.jobPosition || "this position";

            let goodbyeMessage = "";
            if (isEarlyEnd) {
                goodbyeMessage = `Thank you for your time today, ${userName}. I understand you need to end the interview early.

Based on what we covered, you showed good potential and I appreciate your thoughtful responses. Remember, every interview is a learning experience, and you're on the right path.

Keep practicing and preparing - I believe you have what it takes to succeed at ${jobPosition} or any other position you're interested in. Best of luck with your job search!`;
            } else {
                goodbyeMessage = `Excellent work, ${userName}! We've completed all ${maxQuestions} questions for your ${jobPosition} interview.

You demonstrated strong knowledge and communication skills throughout our conversation. I was particularly impressed with your problem-solving approach and how you explained your thought process.

This interview experience should help you feel more confident for your actual interviews. Remember to keep practicing, stay curious, and trust in your abilities.

Thank you for using our AI Interview platform, and best of luck with your interview! I'm confident you'll do great.`;
            }

            await voiceServiceRef.current.speak(goodbyeMessage);

            // Calculate final score (simplified scoring)
            const completionRate = (questionCount / maxQuestions) * 100;
            const finalScore = Math.min(completionRate + Math.random() * 20, 100);

            // Update final interview record
            await updateInterviewRecord({
                status: "completed",
                score: Math.round(finalScore),
                completed_at: new Date().toISOString(),
                feedback: isEarlyEnd ? "Interview ended early" : "Interview completed successfully",
            });

            setIsSpeaking(false);

            // Generate final feedback using existing system
            await GenerateFeedback();
        } catch (error) {
            console.error("Error ending interview:", error);
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

            const result = await axios.post('/api/ai-feedback', {
                conversation: conversation
            });

            console.log(result?.data);
            const Content = result.data.content;
            const FINAL_CONTENT = Content.replace('```json', '').replace('```', '');
            console.log(FINAL_CONTENT);

            // Save to Database
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
            console.error("Error generating feedback:", error);
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
            console.error("Error providing help:", error);
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
        if (voiceServiceRef.current) {
            voiceServiceRef.current.cleanup();
        }
        await endInterview(true);
    }

    return (
        <div className='p-20 lg:px-48 xl:px-56'>
            <h2 className='font-bold text-xl flex justify-between'>AI Interview Session
                <span className='flex gap-2 items-center'>
                    <Timer />
                    <TimerComponent start={isConnected} />
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
                        {isConnected && isWaitingForResponse && "Waiting for response..."}
                        {isConnected && !isSpeaking && !isListening && !isWaitingForResponse && "Ready"}
                    </div>

                    {/* Question Counter */}
                    {isConnected && (
                        <div className="text-xs text-gray-500">
                            Question {questionCount} of {maxQuestions}
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {showError && (
                <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p className="text-sm">{errorMessage}</p>
                    {errorMessage.includes("Microphone") && (
                        <Button
                            onClick={handleRequestMicrophonePermission}
                            disabled={isRequestingPermission}
                            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs"
                        >
                            {isRequestingPermission ? "Requesting..." : "Try Again"}
                        </Button>
                    )}
                </div>
            )}

            {/* Microphone Permission */}
            {!isConnected && microphonePermission !== 'granted' && (
                <div className="mt-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                    <p className="text-sm mb-3">🎤 This interview requires microphone access for voice interaction.</p>
                    <Button
                        onClick={handleRequestMicrophonePermission}
                        disabled={isRequestingPermission}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
                    >
                        {isRequestingPermission ? "Requesting..." : "Allow Microphone Access"}
                    </Button>
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
                        disabled={microphonePermission === 'denied' || loading}
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

            <h2 className='text-sm text-gray-400 text-center mt-5'>
                {!isConnected ? "Click 'Start Interview' to begin" : "Interview in Progress..."}
            </h2>
        </div>
    )
}

export default StartInterview
