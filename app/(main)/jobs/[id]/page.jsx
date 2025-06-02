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

        // Check if user has credits for job application
        try {
            const { data: canApply, error: creditError } = await supabase
                .rpc('can_apply_for_job', { user_id: user.id });

            if (creditError) {
                console.error('Error checking credits:', creditError);
                console.error('Full credit error:', JSON.stringify(creditError, null, 2));

                // If function doesn't exist, continue without credit check
                if (creditError.code === '42883') {
                    console.log('Credit function not available, proceeding with application');
                } else {
                    toast.error('Error checking application permissions');
                    return;
                }
            } else if (!canApply) {
                toast.error('Insufficient credits for job application. Please purchase more credits to continue.');
                router.push('/billing');
                return;
            }
        } catch (error) {
            console.error('Exception checking credits:', error);
            // Continue without credit check if there's an error
            console.log('Proceeding with application despite credit check error');
        }

        try {
            setApplying(true);

            // Generate a unique interview ID
            const interview_id = `interview_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            // Step 1: Pre-generate interview questions using our API
            console.log("Generating interview questions...");
            let questionsData;
            try {
                const questionsResponse = await fetch('/api/generate-questions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        jobTitle: job.job_title,
                        jobDescription: job.job_description,
                        requiredSkills: job.required_skills,
                        experienceLevel: job.experience_level,
                        questionCount: job.question_count || 10
                    }),
                });

                // Get the response data even if status is not OK
                questionsData = await questionsResponse.json();

                if (!questionsResponse.ok) {
                    console.warn(`API returned status ${questionsResponse.status}: ${questionsResponse.statusText}`);
                    console.warn("API response:", questionsData);

                    if (!questionsData.questions) {
                        // Create default questions if none were returned
                        questionsData.questions = [
                            `Tell me about your experience related to ${job.job_title}.`,
                            `What specific skills do you have that make you a good fit for this position?`,
                            `How do you stay updated with the latest trends and technologies in this field?`,
                            `Describe a challenging project you worked on and how you overcame obstacles.`,
                            `How do you handle tight deadlines and pressure?`,
                            `Give an example of how you've used problem-solving skills in a previous role.`,
                            `How do you collaborate with team members who have different working styles?`,
                            `What interests you most about this position?`,
                            `Where do you see yourself professionally in 5 years?`,
                            `Do you have any questions about the role or company?`
                        ];
                    }
                }
            } catch (error) {
                console.error("Error fetching questions:", error);
                // Create default questions if fetch fails
                questionsData = {
                    questions: [
                        `Tell me about your experience related to ${job.job_title}.`,
                        `What specific skills do you have that make you a good fit for this position?`,
                        `How do you stay updated with the latest trends and technologies in this field?`,
                        `Describe a challenging project you worked on and how you overcame obstacles.`,
                        `How do you handle tight deadlines and pressure?`,
                        `Give an example of how you've used problem-solving skills in a previous role.`,
                        `How do you collaborate with team members who have different working styles?`,
                        `What interests you most about this position?`,
                        `Where do you see yourself professionally in 5 years?`,
                        `Do you have any questions about the role or company?`
                    ]
                };
            }

            console.log("Generated questions:", questionsData.questions);

            // Step 2: Create an interview with the pre-generated questions
            const interviewData = {
                interview_id: interview_id,
                useremail: user.email,
                username: user.name || 'Candidate',
                jobposition: job.job_title,
                jobdescription: job.job_description,
                duration: 15, // Default duration in minutes
                type: "Job Application",
                experiencelevel: job.experience_level || "Mid-Level",
                requiredskills: job.required_skills || "",
                companycriteria: job.ai_criteria || "",
                companyid: job.company_id,
                jobid: job.id,
                questionlist: JSON.stringify(questionsData.questions) // Store pre-generated questions
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

            // Step 3: Deduct credits for job application
            try {
                const { data: creditDeducted, error: creditDeductionError } = await supabase
                    .rpc('deduct_credits_for_application', {
                        user_id: user.id,
                        job_id: job.id
                    });

                if (creditDeductionError) {
                    console.error("Error deducting credits:", creditDeductionError);
                    console.error("Full credit deduction error:", JSON.stringify(creditDeductionError, null, 2));

                    // If function doesn't exist, continue without credit deduction
                    if (creditDeductionError.code === '42883') {
                        console.log('Credit deduction function not available, proceeding with application');
                    } else {
                        toast.error("Failed to process credit deduction");
                        setApplying(false);
                        return;
                    }
                } else if (!creditDeducted) {
                    toast.error("Unable to process application. You may have already applied for this job or have insufficient credits.");
                    setApplying(false);
                    return;
                }
            } catch (error) {
                console.error("Exception deducting credits:", error);
                // Continue without credit deduction if there's an error
                console.log('Proceeding with application despite credit deduction error');
            }

            // Step 4: Create a job submission record
            const submissionData = {
                job_id: job.id,
                user_id: user.id,
                user_name: user.name || 'Candidate',
                user_email: user.email,
                application_status: 'pending',
                interview_completed: false
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
