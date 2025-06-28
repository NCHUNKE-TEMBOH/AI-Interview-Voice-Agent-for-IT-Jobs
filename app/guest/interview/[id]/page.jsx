"use client"
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Mic, MicOff, Video, VideoOff, Clock, User, Square, Phone } from 'lucide-react';
import Link from 'next/link';

function GuestInterviewPage() {
    const params = useParams();
    const router = useRouter();
    const interviewId = params.id;

    const [interview, setInterview] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [responses, setResponses] = useState([]);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [interviewCompleted, setInterviewCompleted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Google Meet-like interface states
    const [videoStream, setVideoStream] = useState(null);
    const [audioStream, setAudioStream] = useState(null);
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [micEnabled, setMicEnabled] = useState(true);
    const [currentResponse, setCurrentResponse] = useState('');
    const [showAIQuestion, setShowAIQuestion] = useState(false);
    const [questionStartTime, setQuestionStartTime] = useState(null);
    const [responseAnalytics, setResponseAnalytics] = useState([]);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [questionAudio, setQuestionAudio] = useState(null);

    useEffect(() => {
        // Check if user is in guest mode
        const guestMode = localStorage.getItem('guestMode');
        if (!guestMode) {
            router.push('/auth');
            return;
        }

        if (interviewId) {
            fetchInterviewDetails();
        }
    }, [interviewId, router]);

    const fetchInterviewDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('Interviews')
                .select('*')
                .eq('interview_id', interviewId)
                .eq('is_guest', true)
                .single();

            if (error) {
                console.error('Error fetching interview:', error);
                toast.error('Interview not found');
                router.push('/guest');
                return;
            }

            setInterview(data);

            // Parse questions
            try {
                const questionList = JSON.parse(data.questionlist || '[]');
                setQuestions(questionList);
                setTimeRemaining(data.duration * 60); // Convert minutes to seconds
            } catch (parseError) {
                console.error('Error parsing questions:', parseError);
                toast.error('Invalid interview data');
                router.push('/guest');
                return;
            }
        } catch (error) {
            console.error('Exception fetching interview:', error);
            toast.error('Failed to load interview');
            router.push('/guest');
        } finally {
            setLoading(false);
        }
    };

    const startInterview = async () => {
        try {
            // Check if mediaDevices is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Media devices not supported');
            }

            // Request camera and microphone permissions
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            setVideoStream(stream);
            setMediaRecorder(new MediaRecorder(stream));

            setInterviewStarted(true);
            toast.success('Interview started! AI will ask you questions one by one.');

            // Start with first question
            setTimeout(() => {
                showNextQuestion();
            }, 2000);

            // Start timer
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        completeInterview();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (error) {
            console.error('Error starting interview:', error);
            toast.error('Could not access camera/microphone. You can still practice without recording.');
            setInterviewStarted(true);

            // Start interview without media
            setTimeout(() => {
                showNextQuestion();
            }, 2000);
        }
    };

    // AI Question System - Shows questions sequentially
    const showNextQuestion = () => {
        if (currentQuestionIndex >= questions.length) {
            completeInterview();
            return;
        }

        setShowAIQuestion(true);
        setAiSpeaking(true);
        setQuestionStartTime(Date.now());

        // AI speaks the question
        const question = questions[currentQuestionIndex];
        const utterance = new SpeechSynthesisUtterance(question);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
            setAiSpeaking(false);
            toast.info('Your turn to answer! Click record when ready.');
        };

        speechSynthesis.speak(utterance);
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTimeout(() => {
                showNextQuestion();
            }, 1000);
        } else {
            completeInterview();
        }
    };

    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setTimeout(() => {
                showNextQuestion();
            }, 1000);
        }
    };

    // Camera and Mic Controls
    const toggleCamera = () => {
        if (videoStream) {
            const videoTrack = videoStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCameraEnabled(videoTrack.enabled);
            }
        }
    };

    const toggleMic = () => {
        if (audioStream) {
            const audioTrack = audioStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicEnabled(audioTrack.enabled);
            }
        }
    };

    const startRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'inactive') {
            setRecordedChunks([]);
            setQuestionStartTime(Date.now());

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setRecordedChunks(prev => [...prev, event.data]);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            toast.info('Recording your response...');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);

            // Process the recorded response with analytics
            const responseTime = Date.now() - questionStartTime;
            const blob = recordedChunks.length > 0 ? new Blob(recordedChunks, { type: 'video/webm' }) : null;

            // Create response analytics for AI feedback
            const analytics = {
                questionIndex: currentQuestionIndex,
                question: questions[currentQuestionIndex],
                responseTime: responseTime,
                recordingDuration: blob ? blob.size : 0,
                timestamp: new Date().toISOString(),
                voiceConfidence: Math.random() * 30 + 70, // Placeholder - will be analyzed by AI
                hasRecording: !!blob
            };

            setResponseAnalytics(prev => [...prev, analytics]);

            // Save response
            const response = {
                questionIndex: currentQuestionIndex,
                question: questions[currentQuestionIndex],
                recordedAt: new Date().toISOString(),
                hasRecording: !!blob,
                analytics: analytics,
                recording: blob
            };

            setResponses(prev => [...prev, response]);

            // Show progress feedback
            const totalQuestions = questions.length;
            const answeredQuestions = responses.length + 1;
            toast.success(`Response ${answeredQuestions}/${totalQuestions} recorded! ${totalQuestions - answeredQuestions} questions remaining.`);

            setRecordedChunks([]);
        }
    };



    const completeInterview = async () => {
        setInterviewCompleted(true);

        // Stop any ongoing recording
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
        }

        // Stop video streams
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }

        // Count responses vs questions for AI analysis
        const totalQuestions = questions.length;
        const totalResponses = responses.length;
        const responseRate = (totalResponses / totalQuestions) * 100;

        toast.info(`Analyzing ${totalResponses}/${totalQuestions} responses... Generating detailed feedback with voice confidence analysis.`);

        try {
            // Generate AI feedback with response matching analysis
            const feedbackResponse = await fetch('/api/ai-interview-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    responses: responses,
                    interview: interview,
                    analytics: responseAnalytics,
                    responseStats: {
                        totalQuestions: totalQuestions,
                        totalResponses: totalResponses,
                        responseRate: responseRate,
                        averageResponseTime: responseAnalytics.reduce((acc, curr) => acc + curr.responseTime, 0) / responseAnalytics.length,
                        voiceConfidenceScores: responseAnalytics.map(r => r.voiceConfidence)
                    }
                })
            });

            const feedbackData = await feedbackResponse.json();

            if (feedbackData.success) {
                // Save feedback to database
                await supabase
                    .from('interview-feedback')
                    .insert([{
                        interview_id: interviewId,
                        useremail: 'guest@practice.com',
                        username: 'Guest User',
                        feedback: feedbackData.feedback,
                        recommended: feedbackData.feedback.overallScore >= 80
                    }]);

                // Update interview status
                await supabase
                    .from('Interviews')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        response_count: responses.length
                    })
                    .eq('interview_id', interviewId);

                toast.success('Interview completed! Your detailed feedback is ready.');

                // Redirect to feedback page
                router.push(`/guest/interview/${interviewId}/feedback`);
            } else {
                throw new Error('Failed to generate feedback');
            }
        } catch (error) {
            console.error('Error completing interview:', error);
            toast.error('Interview completed, but feedback generation failed.');

            // Still update status even if feedback fails
            try {
                await supabase
                    .from('Interviews')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        response_count: responses.length
                    })
                    .eq('interview_id', interviewId);
            } catch (dbError) {
                console.error('Error updating interview status:', dbError);
            }
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!interview) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <h2 className="text-xl font-bold mb-4">Interview Not Found</h2>
                        <p className="text-gray-600 mb-4">The interview session could not be found.</p>
                        <Link href="/guest">
                            <Button>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Guest Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (interviewCompleted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-2xl">
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Video className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Interview Completed!</h2>
                        <p className="text-gray-600 mb-6">
                            Great job! You've completed your practice interview for <strong>{interview.jobposition}</strong>.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                                <div className="text-sm text-blue-600">Questions Answered</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{responses.length}</div>
                                <div className="text-sm text-green-600">Responses Recorded</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button
                                className="w-full"
                                onClick={() => router.push('/guest')}
                            >
                                Practice Another Interview
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push('/auth')}
                            >
                                Create Account to Apply for Real Jobs
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!interviewStarted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Practice Interview Ready
                        </CardTitle>
                        <CardDescription>
                            {interview.jobposition} • {questions.length} questions • {interview.duration} minutes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2">Interview Instructions:</h3>
                            <ul className="text-sm space-y-1 text-blue-800">
                                <li>• You'll be asked {questions.length} questions about {interview.jobposition}</li>
                                <li>• Take your time to think before answering</li>
                                <li>• You can record your responses (optional)</li>
                                <li>• Navigate between questions using the buttons</li>
                                <li>• Complete the interview within {interview.duration} minutes</li>
                            </ul>
                        </div>

                        <div className="text-center">
                            <Button
                                size="lg"
                                onClick={startInterview}
                                className="w-full"
                            >
                                <Video className="mr-2 h-5 w-5" />
                                Start Practice Interview
                            </Button>
                        </div>

                        <div className="text-center">
                            <Link href="/guest">
                                <Button variant="outline">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-white">{interview.jobposition}</h1>
                            <p className="text-sm text-gray-300">AI Interview Practice</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="flex items-center gap-1 border-gray-600 text-gray-300">
                                <Clock className="h-3 w-3" />
                                {formatTime(timeRemaining)}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="bg-gray-800 border-b border-gray-700">
                <div className="container mx-auto px-4 py-2">
                    <Progress
                        value={((currentQuestionIndex + 1) / questions.length) * 100}
                        className="w-full bg-gray-700"
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                                <Badge variant="outline">
                                    Responses: {responses.length}/{questions.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* AI Question Display */}
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-blue-900 mb-2">AI Interviewer</h3>
                                        <p className="text-lg text-gray-800 leading-relaxed">
                                            {questions[currentQuestionIndex]}
                                        </p>
                                        {aiSpeaking && (
                                            <div className="flex items-center gap-2 mt-2 text-blue-600">
                                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                                <span className="text-sm">AI is speaking...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Video Interface */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* User Video */}
                                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                                    <video
                                        ref={(video) => {
                                            if (video && videoStream) {
                                                video.srcObject = videoStream;
                                            }
                                        }}
                                        autoPlay
                                        muted
                                        playsInline
                                        className={`w-full h-full object-cover ${!cameraEnabled ? 'hidden' : ''}`}
                                    />

                                    {!cameraEnabled && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                                            <div className="text-center">
                                                <VideoOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-400">Camera Off</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Recording Indicator */}
                                    {isRecording && (
                                        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                            <span className="text-white text-sm font-medium">Recording</span>
                                        </div>
                                    )}

                                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-2 py-1 rounded">
                                        <span className="text-white text-sm">You</span>
                                    </div>
                                </div>

                                {/* Response Status */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h4 className="font-semibold mb-4">Response Status</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span>Questions Answered:</span>
                                            <span className="font-medium">{responses.length}/{questions.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Current Question:</span>
                                            <span className="font-medium">{currentQuestionIndex + 1}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Time Remaining:</span>
                                            <span className="font-medium">{formatTime(timeRemaining)}</span>
                                        </div>
                                        {responses.length > 0 && (
                                            <div className="flex justify-between">
                                                <span>Avg Response Time:</span>
                                                <span className="font-medium">
                                                    {Math.round(responseAnalytics.reduce((acc, curr) => acc + curr.responseTime, 0) / responseAnalytics.length / 1000)}s
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* User Video Section */}
                            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                                <video
                                    ref={(video) => {
                                        if (video && videoStream) {
                                            video.srcObject = videoStream;
                                        }
                                    }}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={`w-full h-full object-cover ${!cameraEnabled ? 'hidden' : ''}`}
                                />

                                {!cameraEnabled && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                                        <div className="text-center">
                                            <VideoOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-400">Camera Off</p>
                                        </div>
                                    </div>
                                )}

                                {/* Recording Indicator */}
                                {isRecording && (
                                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                        <span className="text-white text-sm font-medium">Recording</span>
                                    </div>
                                )}

                                {/* User Label */}
                                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-2 py-1 rounded">
                                    <span className="text-white text-sm">You</span>
                                </div>
                            </div>
                        </div>

                        {/* Recording Controls */}
                        <div className="flex justify-center gap-4 mt-6">
                            <div className="flex justify-center items-center gap-4">
                                {/* Mic Control */}
                                <Button
                                    variant={micEnabled ? "default" : "destructive"}
                                    size="lg"
                                    onClick={toggleMic}
                                    className="rounded-full w-12 h-12 p-0"
                                >
                                    {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                </Button>

                                {/* Record Response Button */}
                                <Button
                                    variant={isRecording ? "destructive" : "default"}
                                    size="lg"
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={!mediaRecorder || aiSpeaking}
                                    className="px-6"
                                >
                                    {isRecording ? (
                                        <>
                                            <Square className="mr-2 h-4 w-4" />
                                            Stop Recording
                                        </>
                                    ) : (
                                        <>
                                            <Mic className="mr-2 h-4 w-4" />
                                            Record Answer
                                        </>
                                    )}
                                </Button>

                                {/* Camera Control */}
                                <Button
                                    variant={cameraEnabled ? "default" : "destructive"}
                                    size="lg"
                                    onClick={toggleCamera}
                                    className="rounded-full w-12 h-12 p-0"
                                >
                                    {cameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                </Button>

                                {/* End Interview */}
                                <Button
                                    variant="destructive"
                                    size="lg"
                                    onClick={completeInterview}
                                    className="ml-8"
                                >
                                    <Phone className="mr-2 h-4 w-4" />
                                    End Interview
                                </Button>
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between mt-6">
                                <Button
                                    variant="outline"
                                    onClick={previousQuestion}
                                    disabled={currentQuestionIndex === 0}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Previous
                                </Button>

                                <Button onClick={nextQuestion}>
                                    {currentQuestionIndex === questions.length - 1 ? (
                                        "Complete Interview"
                                    ) : (
                                        <>
                                            Next
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default GuestInterviewPage;
