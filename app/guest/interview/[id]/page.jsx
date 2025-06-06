"use client"
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Mic, MicOff, Video, VideoOff, Clock, User } from 'lucide-react';
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
            // Request camera and microphone permissions
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // Set up media recorder
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setRecordedChunks(prev => [...prev, event.data]);
                }
            };

            setInterviewStarted(true);
            toast.success('Interview started! Good luck!');

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
        }
    };

    const startRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'inactive') {
            setRecordedChunks([]);
            mediaRecorder.start();
            setIsRecording(true);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
            
            // Save response
            const response = {
                questionIndex: currentQuestionIndex,
                question: questions[currentQuestionIndex],
                recordedAt: new Date().toISOString(),
                hasRecording: true
            };
            
            setResponses(prev => [...prev, response]);
            toast.success('Response recorded!');
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            completeInterview();
        }
    };

    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const completeInterview = async () => {
        setInterviewCompleted(true);
        
        // Stop any ongoing recording
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
        }

        // Update interview status in database
        try {
            await supabase
                .from('Interviews')
                .update({ 
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    response_count: responses.length
                })
                .eq('interview_id', interviewId);
        } catch (error) {
            console.error('Error updating interview status:', error);
        }

        toast.success('Interview completed! Thank you for practicing.');
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold">{interview.jobposition}</h1>
                            <p className="text-sm text-gray-600">Practice Interview</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(timeRemaining)}
                            </Badge>
                            <Badge variant="outline">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-2">
                    <Progress 
                        value={((currentQuestionIndex + 1) / questions.length) * 100} 
                        className="w-full"
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <p className="text-lg leading-relaxed">
                                    {questions[currentQuestionIndex]}
                                </p>
                            </div>

                            {/* Recording Controls */}
                            <div className="flex justify-center gap-4">
                                <Button
                                    variant={isRecording ? "destructive" : "default"}
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={!mediaRecorder}
                                >
                                    {isRecording ? (
                                        <>
                                            <MicOff className="mr-2 h-4 w-4" />
                                            Stop Recording
                                        </>
                                    ) : (
                                        <>
                                            <Mic className="mr-2 h-4 w-4" />
                                            Start Recording
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between">
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
