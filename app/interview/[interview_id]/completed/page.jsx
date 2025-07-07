"use client"
import React, { useEffect, useState } from 'react';
import { Home, ArrowRight, Send, Trophy, Clock, MessageSquare, TrendingUp, Star, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/services/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';



const InterviewComplete = () => {
    const router = useRouter();
    const { interview_id } = useParams();
    const [feedbackData, setFeedbackData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInterviewFeedback();
    }, [interview_id]);

    const fetchInterviewFeedback = async () => {
        try {
            setLoading(true);

            // Fetch feedback from database
            const { data, error } = await supabase
                .from('interview-feedback')
                .select('*')
                .eq('interview_id', interview_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error('Error fetching feedback:', error);
                setError('Unable to load interview results');
                return;
            }

            if (data) {
                setFeedbackData(data);
            } else {
                setError('No interview results found');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('An error occurred while loading results');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreGrade = (score) => {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B+';
        if (score >= 60) return 'B';
        if (score >= 50) return 'C+';
        if (score >= 40) return 'C';
        return 'D';
    };

    const getPerformanceLevel = (score) => {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 55) return 'Average';
        if (score >= 40) return 'Below Average';
        return 'Needs Improvement';
    };

    const downloadPDF = () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;
            let yPosition = 30;

            // Header
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('AI Interview Results', pageWidth / 2, yPosition, { align: 'center' });

            yPosition += 20;
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text(`Interview ID: ${interview_id}`, margin, yPosition);
            yPosition += 10;
            doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
            yPosition += 10;
            doc.text(`Candidate: ${feedbackData?.username || 'N/A'}`, margin, yPosition);

            yPosition += 20;

            // Overall Score
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Overall Performance', margin, yPosition);
            yPosition += 15;

            doc.setFontSize(14);
            doc.setFont(undefined, 'normal');
            doc.text(`Score: ${overallScore}% (${getScoreGrade(overallScore)})`, margin, yPosition);
            yPosition += 10;
            doc.text(`Performance Level: ${getPerformanceLevel(overallScore)}`, margin, yPosition);
            yPosition += 20;

            // Strengths
            if (strengths.length > 0) {
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('Strengths:', margin, yPosition);
                yPosition += 10;

                doc.setFont(undefined, 'normal');
                strengths.forEach((strength, index) => {
                    const lines = doc.splitTextToSize(`• ${strength}`, pageWidth - 2 * margin);
                    lines.forEach(line => {
                        doc.text(line, margin, yPosition);
                        yPosition += 7;
                    });
                });
                yPosition += 10;
            }

            // Areas for Improvement
            if (improvements.length > 0) {
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('Areas for Improvement:', margin, yPosition);
                yPosition += 10;

                doc.setFont(undefined, 'normal');
                improvements.forEach((improvement, index) => {
                    const lines = doc.splitTextToSize(`• ${improvement}`, pageWidth - 2 * margin);
                    lines.forEach(line => {
                        doc.text(line, margin, yPosition);
                        yPosition += 7;
                    });
                });
                yPosition += 10;
            }

            // Detailed Feedback
            if (recommendation) {
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('Detailed Feedback:', margin, yPosition);
                yPosition += 10;

                doc.setFont(undefined, 'normal');
                const feedbackLines = doc.splitTextToSize(recommendation, pageWidth - 2 * margin);
                feedbackLines.forEach(line => {
                    if (yPosition > 270) { // Check if we need a new page
                        doc.addPage();
                        yPosition = 30;
                    }
                    doc.text(line, margin, yPosition);
                    yPosition += 7;
                });
                yPosition += 10;
            }

            // Statistics
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Interview Statistics:', margin, yPosition);
            yPosition += 10;

            doc.setFont(undefined, 'normal');
            doc.text(`Questions Completed: ${feedback.questionsCompleted || feedback.questions_completed || 'N/A'}`, margin, yPosition);
            yPosition += 7;
            doc.text(`Duration: ${feedback.actualDuration || feedback.actual_duration || 'N/A'} minutes`, margin, yPosition);
            yPosition += 7;
            doc.text(`Communication Score: ${feedback.communicationScore || Math.round(overallScore * 0.8) || 'N/A'}%`, margin, yPosition);
            yPosition += 7;
            doc.text(`Confidence Level: ${feedback.confidenceLevel || (overallScore >= 70 ? 'High' : overallScore >= 50 ? 'Medium' : 'Low')}`, margin, yPosition);

            // Footer
            yPosition = doc.internal.pageSize.height - 20;
            doc.setFontSize(10);
            doc.text('Generated by AI Interview System', pageWidth / 2, yPosition, { align: 'center' });

            // Save the PDF
            doc.save(`Interview_Results_${interview_id}_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('PDF downloaded successfully!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your interview results...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Results</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700">
                        <Home className="w-4 h-4 mr-2" />
                        Return Home
                    </Button>
                </div>
            </div>
        );
    }

    const feedback = feedbackData?.feedback || {};
    const overallScore = feedback.overallScore || feedback.score || 0;
    const strengths = feedback.strengths || [];
    const improvements = feedback.improvements || feedback.areasForImprovement || [];
    const recommendation = feedback.recommendation || feedback.overallFeedback || "Continue practicing to improve your interview skills.";

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Completed!</h1>
                    <p className="text-gray-600">Here's your detailed performance analysis</p>
                </div>

                {/* Overall Score Card */}
                <Card className="mb-6 border-2 border-blue-200">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl text-gray-800">Overall Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="flex items-center justify-center space-x-8 mb-4">
                            <div>
                                <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
                                    {overallScore}%
                                </div>
                                <div className="text-gray-600 text-sm">Overall Score</div>
                            </div>
                            <div>
                                <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                                    {getScoreGrade(overallScore)}
                                </div>
                                <div className="text-gray-600 text-sm">Grade</div>
                            </div>
                        </div>
                        <Badge
                            variant={overallScore >= 70 ? "default" : overallScore >= 50 ? "secondary" : "destructive"}
                            className="text-lg px-4 py-2"
                        >
                            {getPerformanceLevel(overallScore)}
                        </Badge>
                    </CardContent>
                </Card>

                {/* Performance Metrics */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Strengths */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-green-700">
                                <TrendingUp className="w-5 h-5 mr-2" />
                                Strengths
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {strengths.length > 0 ? (
                                <ul className="space-y-2">
                                    {strengths.map((strength, index) => (
                                        <li key={index} className="flex items-start">
                                            <Star className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm text-gray-700">{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-sm">No specific strengths identified in this session.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Areas for Improvement */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-orange-700">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                Areas for Improvement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {improvements.length > 0 ? (
                                <ul className="space-y-2">
                                    {improvements.map((improvement, index) => (
                                        <li key={index} className="flex items-start">
                                            <ArrowRight className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm text-gray-700">{improvement}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-sm">Great job! No major areas for improvement identified.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Feedback */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center text-blue-700">
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Detailed Feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-gray-700 leading-relaxed">
                                {recommendation}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Interview Statistics */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center text-purple-700">
                            <Trophy className="w-5 h-5 mr-2" />
                            Interview Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-800">
                                    {feedback.questionsCompleted || feedback.questions_completed || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-600">Questions Answered</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-800">
                                    {feedback.actualDuration || feedback.actual_duration || 'N/A'}min
                                </div>
                                <div className="text-sm text-gray-600">Interview Duration</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-800">
                                    {feedback.communicationScore || Math.round(overallScore * 0.8) || 'N/A'}%
                                </div>
                                <div className="text-sm text-gray-600">Communication</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-800">
                                    {feedback.confidenceLevel || (overallScore >= 70 ? 'High' : overallScore >= 50 ? 'Medium' : 'Low')}
                                </div>
                                <div className="text-sm text-gray-600">Confidence Level</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={downloadPDF}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Download PDF Report
                    </Button>
                    <Button
                        onClick={() => router.push('/')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Return to Home
                    </Button>
                    <Button
                        onClick={() => router.push('/jobs')}
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
                    >
                        <Send className="w-5 h-5 mr-2" />
                        Find More Jobs
                    </Button>
                </div>

                {/* Success Message */}
                <div className="text-center mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800 font-medium">
                        🎉 Congratulations on completing your AI interview!
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                        Use this feedback to improve your interview skills and increase your chances of success.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InterviewComplete;

