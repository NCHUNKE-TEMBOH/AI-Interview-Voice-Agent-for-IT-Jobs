"use client"
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/services/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Download, Star, TrendingUp, MessageCircle, Clock, Target, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

function GuestFeedbackPage() {
    const params = useParams();
    const router = useRouter();
    const interviewId = params.id;

    const [feedback, setFeedback] = useState(null);
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is in guest mode
        const guestMode = localStorage.getItem('guestMode');
        if (!guestMode) {
            router.push('/auth');
            return;
        }

        fetchFeedback();
    }, [interviewId]);

    const fetchFeedback = async () => {
        try {
            // Fetch interview details
            const { data: interviewData, error: interviewError } = await supabase
                .from('Interviews')
                .select('*')
                .eq('interview_id', interviewId)
                .single();

            if (interviewError) throw interviewError;
            setInterview(interviewData);

            // Fetch feedback
            const { data: feedbackData, error: feedbackError } = await supabase
                .from('interview-feedback')
                .select('*')
                .eq('interview_id', interviewId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (feedbackError) throw feedbackError;
            setFeedback(feedbackData.feedback);

        } catch (error) {
            console.error('Error fetching feedback:', error);
            toast.error('Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-600 bg-green-50';
        if (score >= 80) return 'text-blue-600 bg-blue-50';
        if (score >= 70) return 'text-yellow-600 bg-yellow-50';
        if (score >= 60) return 'text-orange-600 bg-orange-50';
        return 'text-red-600 bg-red-50';
    };

    const getScoreIcon = (score) => {
        if (score >= 80) return <CheckCircle className="w-5 h-5" />;
        return <AlertCircle className="w-5 h-5" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your feedback...</p>
                </div>
            </div>
        );
    }

    if (!feedback || !interview) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="text-center p-6">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Feedback Not Found</h2>
                        <p className="text-gray-600 mb-4">We couldn't find feedback for this interview.</p>
                        <Link href="/guest">
                            <Button>Back to Dashboard</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <Link href="/guest">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900">Interview Feedback</h1>
                            <p className="text-gray-600">
                                {interview?.jobposition} • Completed on {new Date().toLocaleDateString()}
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    
                    {/* Overall Score */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500" />
                                Overall Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`text-4xl font-bold px-4 py-2 rounded-lg ${getScoreColor(feedback.overallScore)}`}>
                                        {feedback.overallScore}
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold">
                                            {feedback.overallScore >= 90 ? 'Excellent' :
                                             feedback.overallScore >= 80 ? 'Good' :
                                             feedback.overallScore >= 70 ? 'Average' :
                                             feedback.overallScore >= 60 ? 'Below Average' : 'Needs Improvement'}
                                        </p>
                                        <p className="text-gray-600">Out of 100</p>
                                    </div>
                                </div>
                                {getScoreIcon(feedback.overallScore)}
                            </div>
                            <p className="text-gray-700">{feedback.overallFeedback}</p>
                        </CardContent>
                    </Card>

                    {/* Detailed Metrics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                Detailed Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(feedback.detailedMetrics || {}).map(([key, metric]) => (
                                    <div key={key} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <Badge className={getScoreColor(metric.score)}>
                                                {metric.score}/100
                                            </Badge>
                                        </div>
                                        <Progress value={metric.score} className="h-2" />
                                        <p className="text-sm text-gray-600">{metric.feedback}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Strengths and Areas for Improvement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                    Strengths
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {feedback.strengths?.map((strength, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-600">
                                    <Target className="w-5 h-5" />
                                    Areas for Improvement
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {feedback.areasForImprovement?.map((area, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <Target className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{area}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Question Analysis */}
                    {feedback.questionAnalysis && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-purple-500" />
                                    Question-by-Question Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {feedback.questionAnalysis.map((analysis, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium">Question {analysis.questionNumber}</h4>
                                                <Badge className={getScoreColor(analysis.score)}>
                                                    {analysis.score}/100
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{analysis.question}</p>
                                            <p className="text-sm mb-2">{analysis.feedback}</p>
                                            {analysis.suggestions && (
                                                <div className="mt-2">
                                                    <p className="text-xs font-medium text-gray-700 mb-1">Suggestions:</p>
                                                    <ul className="text-xs text-gray-600 space-y-1">
                                                        {analysis.suggestions.map((suggestion, idx) => (
                                                            <li key={idx}>• {suggestion}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Next Steps and Recommendations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-600">
                                    <Clock className="w-5 h-5" />
                                    Next Steps
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {feedback.nextSteps?.map((step, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                                {index + 1}
                                            </div>
                                            <span className="text-sm">{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-purple-600">
                                    <Target className="w-5 h-5" />
                                    Practice Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {feedback.practiceRecommendations?.map((recommendation, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <Target className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">{recommendation}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/guest">
                            <Button size="lg" className="w-full sm:w-auto">
                                Practice Another Interview
                            </Button>
                        </Link>
                        <Link href="/auth">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                Create Account for Real Jobs
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GuestFeedbackPage;
