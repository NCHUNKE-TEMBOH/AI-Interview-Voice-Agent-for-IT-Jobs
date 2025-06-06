"use client"
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabaseClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Mic, MicOff, Video, VideoOff, Clock, User, Play, Pause } from 'lucide-react';
import Link from 'next/link';

function InterviewPage() {
    const params = useParams();
    const router = useRouter();
    const interviewId = params.interview_id;

    const [interview, setInterview] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [stream, setStream] = useState(null);
    const [responses, setResponses] = useState([]);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [interviewCompleted, setInterviewCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [audioLevel, setAudioLevel] = useState(0);
    
    const videoRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (interviewId) {
            fetchInterviewDetails();
        }
    }, [interviewId]);

    const fetchInterviewDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('Interviews')
                .select('*')
                .eq('interview_id', interviewId)
                .single();

            if (error) {
                console.error('Error fetching interview:', error);
                toast.error('Interview not found');
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
                return;
            }
        } catch (error) {
            console.error('Exception fetching interview:', error);
            toast.error('Failed to load interview');
        } finally {
            setLoading(false);
        }
    };

    const setupAudioAnalyser = (stream) => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            
            analyser.fftSize = 256;
            microphone.connect(analyser);
            
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            
            const updateAudioLevel = () => {
                if (analyserRef.current) {
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                    analyserRef.current.getByteFrequencyData(dataArray);

                    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
                    setAudioLevel(average);
                }
                animationRef.current = requestAnimationFrame(updateAudioLevel);
            };
            
            updateAudioLevel();
        } catch (error) {
            console.error('Error setting up audio analyser:', error);
        }
    };

    const startInterview = async () => {
        try {
            // Request camera and microphone permissions with high quality settings
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 1
                }
            });

            setStream(mediaStream);
            
            // Set up video preview
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            // Set up audio level monitoring
            setupAudioAnalyser(mediaStream);

            // Set up media recorder with high quality settings
            const recorder = new MediaRecorder(mediaStream, {
                mimeType: 'video/webm;codecs=vp9,opus',
                audioBitsPerSecond: 128000,
                videoBitsPerSecond: 2500000
            });
            
            setMediaRecorder(recorder);
            setInterviewStarted(true);
            toast.success('Interview started! Camera and microphone are active.');

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
            toast.error('Could not access camera/microphone. Please check permissions and try again.');
        }
    };

    const startRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'inactive') {
            const chunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const currentQuestion = questions[currentQuestionIndex];
                const questionText = typeof currentQuestion === 'string'
                    ? currentQuestion
                    : currentQuestion?.question || 'Question not available';

                const response = {
                    questionIndex: currentQuestionIndex,
                    question: questionText,
                    recordedAt: new Date().toISOString(),
                    hasRecording: true,
                    recordingBlob: blob
                };

                setResponses(prev => [...prev, response]);
                toast.success('Response recorded successfully!');
            };

            mediaRecorder.start();
            setIsRecording(true);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
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
        
        // Stop recording and cleanup
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
        }

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
        }

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        // Update interview status
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

        toast.success('Interview completed! Thank you.');
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
                        <p className="text-gray-600 mb-4">The interview session could not be found or has expired.</p>
                        <Link href="/">
                            <Button>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go Home
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
                            Thank you for completing the interview for <strong>{interview.jobposition}</strong>.
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

                        <Link href="/">
                            <Button className="w-full">
                                Go Home
                            </Button>
                        </Link>
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
                            AI Interview Ready
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
                                <li>• Your camera and microphone will be activated</li>
                                <li>• Record your responses by clicking the record button</li>
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
                                Start AI Interview
                            </Button>
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
                            <p className="text-sm text-gray-600">AI Interview Session</p>
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
                <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Video Preview */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Your Video</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative bg-black rounded-lg overflow-hidden">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-64 object-cover"
                                    />
                                    {/* Audio Level Indicator */}
                                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                        <Mic className={`h-4 w-4 ${audioLevel > 10 ? 'text-green-400' : 'text-gray-400'}`} />
                                        <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-green-400 transition-all duration-100"
                                                style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Question and Controls */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <p className="text-lg leading-relaxed">
                                        {typeof questions[currentQuestionIndex] === 'string'
                                            ? questions[currentQuestionIndex]
                                            : questions[currentQuestionIndex]?.question || 'Question not available'
                                        }
                                    </p>
                                    {questions[currentQuestionIndex]?.type && (
                                        <p className="text-sm text-blue-600 mt-2">
                                            Type: {questions[currentQuestionIndex].type}
                                        </p>
                                    )}
                                </div>

                                {/* Recording Controls */}
                                <div className="flex justify-center gap-4">
                                    <Button
                                        variant={isRecording ? "destructive" : "default"}
                                        onClick={isRecording ? stopRecording : startRecording}
                                        size="lg"
                                    >
                                        {isRecording ? (
                                            <>
                                                <Pause className="mr-2 h-4 w-4" />
                                                Stop Recording
                                            </>
                                        ) : (
                                            <>
                                                <Play className="mr-2 h-4 w-4" />
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
        </div>
    );
}

export default InterviewPage;
