"use client"
import { useUser } from '@/app/provider'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/services/supabaseClient';
import { ArrowLeft, BriefcaseIcon, Calendar, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner';

function ApplicationHistory() {
    const { user } = useUser();
    const router = useRouter();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected

    useEffect(() => {
        if (user?.id) {
            fetchApplications();
        }
    }, [user]);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            // First, try to get job submissions without foreign key relationships
            let submissionsQuery;

            // Check if user_id column exists
            const { data: columnCheck, error: columnError } = await supabase
                .from('Job_Submissions')
                .select('user_id')
                .limit(1);

            if (columnError && columnError.code === '42703') {
                // user_id column doesn't exist, use user_email
                submissionsQuery = supabase
                    .from('Job_Submissions')
                    .select('*')
                    .eq('user_email', user.email);
            } else {
                // user_id column exists, use it
                submissionsQuery = supabase
                    .from('Job_Submissions')
                    .select('*')
                    .eq('user_id', user.id);
            }

            const { data: submissions, error: submissionsError } = await submissionsQuery
                .order('created_at', { ascending: false });

            if (submissionsError) {
                console.error('Error fetching submissions:', submissionsError);
                console.error('Full error details:', JSON.stringify(submissionsError, null, 2));
                toast.error(`Failed to load applications: ${submissionsError.message || 'Unknown error'}`);
                return;
            }

            if (!submissions || submissions.length === 0) {
                setApplications([]);
                return;
            }

            // Now fetch job details separately for each submission
            const applicationsWithJobs = await Promise.all(
                submissions.map(async (submission) => {
                    try {
                        // Fetch job details with specific foreign key
                        let { data: job, error: jobError } = await supabase
                            .from('Jobs')
                            .select(`
                                id,
                                job_title,
                                employment_type,
                                location_type,
                                salary_range,
                                Companies!Jobs_company_id_fkey (
                                    name,
                                    picture
                                )
                            `)
                            .eq('id', submission.job_id)
                            .single();

                        // If that fails, try the alternative foreign key
                        if (jobError && (jobError.code === 'PGRST200' || jobError.code === 'PGRST201')) {
                            const { data: altJob, error: altJobError } = await supabase
                                .from('Jobs')
                                .select(`
                                    id,
                                    job_title,
                                    employment_type,
                                    location_type,
                                    salary_range,
                                    Companies!jobs_company_id_fkey (
                                        name,
                                        picture
                                    )
                                `)
                                .eq('id', submission.job_id)
                                .single();

                            if (!altJobError) {
                                job = altJob;
                                jobError = null;
                            } else {
                                // Fetch job and company separately
                                const { data: jobOnly, error: jobOnlyError } = await supabase
                                    .from('Jobs')
                                    .select('id, job_title, employment_type, location_type, salary_range, company_id')
                                    .eq('id', submission.job_id)
                                    .single();

                                if (!jobOnlyError && jobOnly) {
                                    const { data: company } = await supabase
                                        .from('Companies')
                                        .select('name, picture')
                                        .eq('id', jobOnly.company_id)
                                        .single();

                                    job = {
                                        ...jobOnly,
                                        Companies: company
                                    };
                                    jobError = null;
                                }
                            }
                        }

                        if (jobError) {
                            console.error(`Error fetching job ${submission.job_id}:`, jobError);
                            // Return submission with null job data if job fetch fails
                            return {
                                ...submission,
                                Jobs: null
                            };
                        }

                        return {
                            ...submission,
                            Jobs: job
                        };
                    } catch (error) {
                        console.error(`Exception fetching job for submission ${submission.id}:`, error);
                        return {
                            ...submission,
                            Jobs: null
                        };
                    }
                })
            );

            setApplications(applicationsWithJobs);
        } catch (error) {
            console.error('Exception fetching applications:', error);
            console.error('Full exception details:', JSON.stringify(error, null, 2));
            toast.error(`Failed to load applications: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status, interviewCompleted) => {
        switch (status) {
            case 'accepted':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Accepted
                </Badge>;
            case 'rejected':
                return <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Rejected
                </Badge>;
            case 'pending':
            default:
                if (interviewCompleted) {
                    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        <Clock className="h-3 w-3 mr-1" />
                        Under Review
                    </Badge>;
                } else {
                    return <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending Interview
                    </Badge>;
                }
        }
    };

    const getStatusColor = (status, interviewCompleted) => {
        switch (status) {
            case 'accepted': return 'border-l-green-500';
            case 'rejected': return 'border-l-red-500';
            case 'pending':
            default:
                return interviewCompleted ? 'border-l-blue-500' : 'border-l-yellow-500';
        }
    };

    const filteredApplications = applications.filter(app => {
        if (filter === 'all') return true;
        if (filter === 'pending') return app.application_status === 'pending' || !app.application_status;
        return app.application_status === filter;
    });

    const getFilterCount = (filterType) => {
        if (filterType === 'all') return applications.length;
        if (filterType === 'pending') return applications.filter(app => app.application_status === 'pending' || !app.application_status).length;
        return applications.filter(app => app.application_status === filterType).length;
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="text-center py-12">
                    <p>Loading your applications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Application History</h1>
                    <p className="text-gray-600">Track your job applications and their status</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                <Button 
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    size="sm"
                >
                    All ({getFilterCount('all')})
                </Button>
                <Button 
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    onClick={() => setFilter('pending')}
                    size="sm"
                >
                    Pending ({getFilterCount('pending')})
                </Button>
                <Button 
                    variant={filter === 'accepted' ? 'default' : 'outline'}
                    onClick={() => setFilter('accepted')}
                    size="sm"
                >
                    Accepted ({getFilterCount('accepted')})
                </Button>
                <Button 
                    variant={filter === 'rejected' ? 'default' : 'outline'}
                    onClick={() => setFilter('rejected')}
                    size="sm"
                >
                    Rejected ({getFilterCount('rejected')})
                </Button>
            </div>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BriefcaseIcon className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                            {filter === 'all' ? 'No Applications Yet' : `No ${filter} Applications`}
                        </h3>
                        <p className="text-gray-500 text-center mb-4">
                            {filter === 'all' 
                                ? "You haven't applied for any jobs yet. Start browsing available positions!"
                                : `You don't have any ${filter} applications at the moment.`
                            }
                        </p>
                        {filter === 'all' && (
                            <Button onClick={() => router.push('/jobs')}>
                                <BriefcaseIcon className="h-4 w-4 mr-2" />
                                Browse Jobs
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredApplications.map((application) => (
                        <Card key={application.id} className={`border-l-4 ${getStatusColor(application.application_status, application.interview_completed)}`}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            {/* Company Logo */}
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                {application.Jobs?.Companies?.picture ? (
                                                    <img 
                                                        src={application.Jobs.Companies.picture} 
                                                        alt={application.Jobs.Companies.name}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <BriefcaseIcon className="h-6 w-6 text-gray-400" />
                                                )}
                                            </div>

                                            {/* Job Details */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">
                                                            {application.Jobs?.job_title || 'Job Title Not Available'}
                                                        </h3>
                                                        <p className="text-gray-600">
                                                            {application.Jobs?.Companies?.name || 'Company Name Not Available'}
                                                        </p>
                                                    </div>
                                                    {getStatusBadge(application.application_status, application.interview_completed)}
                                                </div>

                                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <BriefcaseIcon className="h-4 w-4" />
                                                        {application.Jobs?.employment_type || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        Applied {new Date(application.created_at).toLocaleDateString()}
                                                    </span>
                                                    {application.Jobs?.salary_range && (
                                                        <span>{application.Jobs.salary_range}</span>
                                                    )}
                                                </div>

                                                {/* Interview Status */}
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className={`flex items-center gap-1 ${
                                                        application.interview_completed 
                                                            ? 'text-green-600' 
                                                            : 'text-yellow-600'
                                                    }`}>
                                                        {application.interview_completed ? (
                                                            <>
                                                                <CheckCircle className="h-4 w-4" />
                                                                Interview Completed
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Clock className="h-4 w-4" />
                                                                Interview Pending
                                                            </>
                                                        )}
                                                    </span>
                                                    
                                                    {application.cv_screened && (
                                                        <span className="text-blue-600 flex items-center gap-1">
                                                            <Eye className="h-4 w-4" />
                                                            CV Screened
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 ml-4">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => router.push(`/jobs/${application.Jobs?.id}`)}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-1" />
                                            View Job
                                        </Button>
                                        
                                        {!application.interview_completed && (
                                            <Button 
                                                size="sm"
                                                onClick={() => router.push(`/jobs/${application.Jobs?.id}/interview`)}
                                            >
                                                Start Interview
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Summary Stats */}
            {applications.length > 0 && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Application Summary</CardTitle>
                        <CardDescription>Overview of your job application activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                                <div className="text-sm text-gray-600">Total Applications</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {applications.filter(app => app.application_status === 'pending' || !app.application_status).length}
                                </div>
                                <div className="text-sm text-gray-600">Pending</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {applications.filter(app => app.application_status === 'accepted').length}
                                </div>
                                <div className="text-sm text-gray-600">Accepted</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {applications.filter(app => app.application_status === 'rejected').length}
                                </div>
                                <div className="text-sm text-gray-600">Rejected</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default ApplicationHistory
