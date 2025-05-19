"use client"
import { useUser } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/services/supabaseClient';
import { ArrowLeft, BriefcaseBusiness, Building2, Calendar, Clock, DollarSign, MapPin, Sparkles, User } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

function JobDetailPage() {
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const { id } = useParams();
    const { user } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (id) {
            fetchJobDetails();
        }
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('Jobs')
                .select(`
                    *,
                    Companies(id, name, picture, industry_type, description, website)
                `)
                .eq('id', id)
                .single();

            if (error) {
                console.error("Error fetching job details:", error);
                toast.error("Failed to load job details");
            } else {
                console.log("Fetched job details:", data);
                setJob(data);
            }
        } catch (error) {
            console.error("Exception fetching job details:", error);
            toast.error("An error occurred while loading the job");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!user) {
            toast.error("Please sign in to apply for this job");
            router.push('/auth');
            return;
        }

        try {
            setApplying(true);

            // Generate a unique interview ID
            const interview_id = `interview_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            // Create an interview for this job
            const interviewData = {
                interview_id: interview_id, // Add a unique interview_id
                jobPosition: job.job_title,
                userEmail: user.email,
                userName: user.name || 'Candidate',
                duration: 15, // Default duration in minutes
                type: "Job Application",
                experienceLevel: job.experience_level || "Mid-Level",
                requiredSkills: job.required_skills || "",
                companycriterion: job.ai_criteria || "", // Match the database column name
                companyId: job.company_id,
                jobId: job.id,
                questionList: JSON.stringify([]) // Add an empty question list
            };

            console.log("Creating interview with data:", interviewData);

            // Create the interview
            const { data: interview, error } = await supabase
                .from('Interviews')
                .insert([interviewData])
                .select();

            if (error) {
                console.error("Error creating interview:", error);
                toast.error(`Failed to create interview: ${error.message}`);
                setApplying(false);
                return;
            }

            console.log("Interview created:", interview);

            // Create a job submission record
            const submissionData = {
                job_id: job.id,
                user_name: user.name || 'Candidate',
                user_email: user.email,
                status: 'pending'
            };

            console.log("Creating job submission with data:", submissionData);

            const { data: submission, error: submissionError } = await supabase
                .from('Job_Submissions')
                .insert([submissionData])
                .select();

            if (submissionError) {
                console.error("Error creating job submission:", submissionError);
                toast.warning("Application created but submission record failed");
                // Continue anyway since the interview was created
            } else {
                console.log("Job submission created:", submission);
            }

            toast.success("Application started! Redirecting to interview...");

            // Redirect to the interview page
            setTimeout(() => {
                router.push(`/jobs/${id}/interview`);
            }, 1500);
        } catch (error) {
            console.error("Error applying for job:", error);
            toast.error(`Failed to apply for this job: ${error.message || "Unknown error"}`);
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-12 flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="container mx-auto py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
                <p className="mb-6">The job you're looking for doesn't exist or has been removed.</p>
                <Link href="/jobs">
                    <Button>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Jobs
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6">
            <Link href="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to all jobs
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl">{job.job_title}</CardTitle>
                                    <CardDescription className="flex items-center mt-1">
                                        <Building2 className="h-4 w-4 mr-1" />
                                        {job.Companies?.name || "Company"}
                                    </CardDescription>
                                </div>
                                {job.Companies?.picture && (
                                    <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={job.Companies.picture}
                                            alt={job.Companies.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {job.employment_type && (
                                    <Badge variant="outline" className="flex items-center">
                                        <BriefcaseBusiness className="h-3 w-3 mr-1" />
                                        {job.employment_type}
                                    </Badge>
                                )}
                                {job.location_type && (
                                    <Badge variant="outline" className="flex items-center">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {job.location_type}
                                    </Badge>
                                )}
                                {job.experience_level && (
                                    <Badge variant="outline" className="flex items-center">
                                        <User className="h-3 w-3 mr-1" />
                                        {job.experience_level}
                                    </Badge>
                                )}
                                {job.salary_range && (
                                    <Badge variant="outline" className="flex items-center">
                                        <DollarSign className="h-3 w-3 mr-1" />
                                        {job.salary_range}
                                    </Badge>
                                )}
                                {job.application_deadline && (
                                    <Badge variant="outline" className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Due: {new Date(job.application_deadline).toLocaleDateString()}
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                                    <p className="whitespace-pre-line">{job.job_description || "No description provided."}</p>
                                </div>

                                {job.required_skills && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
                                        <p className="whitespace-pre-line">{job.required_skills}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleApply}
                                disabled={applying}
                            >
                                {applying ? "Starting Application..." : "Apply with AI Interview"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>About the Company</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <Building2 className="h-5 w-5 mr-2 text-muted-foreground" />
                                    <span>{job.Companies?.name}</span>
                                </div>
                                {job.Companies?.industry_type && (
                                    <div className="flex items-center">
                                        <BriefcaseBusiness className="h-5 w-5 mr-2 text-muted-foreground" />
                                        <span>{job.Companies.industry_type}</span>
                                    </div>
                                )}
                                {job.Companies?.website && (
                                    <div>
                                        <a
                                            href={job.Companies.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            Visit Website
                                        </a>
                                    </div>
                                )}
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {job.Companies?.description || "No company description available."}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
                                AI Interview Process
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                This job uses AI-powered interviews to assess candidates. Here's how it works:
                            </p>
                            <ol className="space-y-2 list-decimal list-inside text-sm">
                                <li>Click "Apply with AI Interview" to start</li>
                                <li>Complete a {job.question_count || 10}-question interview</li>
                                <li>Your responses will be analyzed by AI</li>
                                <li>The company will review your results</li>
                                <li>You'll be contacted if selected for next steps</li>
                            </ol>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default JobDetailPage;
