"use client"
import { useUser } from '@/app/provider'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/services/supabaseClient';
import { Search, User, FileText, BriefcaseIcon, Calendar, Eye, Download, Brain, Star, Filter } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner';
import CVScreening from '@/app/components/CVScreening';

function CandidatesPage() {
    const { company } = useUser();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [filter, setFilter] = useState('all'); // all, with_cv, pending, screened

    useEffect(() => {
        if (company?.id) {
            fetchCandidates();
        }
    }, [company]);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            // First, get all job submissions for this company's jobs
            let { data: submissions, error: submissionsError } = await supabase
                .from('Job_Submissions')
                .select(`
                    *,
                    Jobs!Job_Submissions_job_id_fkey (
                        id,
                        job_title,
                        company_id
                    )
                `)
                .eq('Jobs.company_id', company.id)
                .order('created_at', { ascending: false });

            // If specific foreign key fails, try alternative
            if (submissionsError && (submissionsError.code === 'PGRST200' || submissionsError.code === 'PGRST201')) {
                console.log('Trying alternative foreign key...');
                const { data: altData, error: altError } = await supabase
                    .from('Job_Submissions')
                    .select(`
                        *,
                        Jobs!job_submissions_job_id_fkey (
                            id,
                            job_title,
                            company_id
                        )
                    `)
                    .eq('Jobs.company_id', company.id)
                    .order('created_at', { ascending: false });

                if (!altError) {
                    submissions = altData;
                    submissionsError = null;
                }
            }

            if (submissionsError) {
                console.error('Error fetching submissions:', submissionsError);
                console.error('Full error details:', JSON.stringify(submissionsError, null, 2));

                // Fallback: fetch submissions and jobs separately
                const { data: allSubmissions, error: fallbackError } = await supabase
                    .from('Job_Submissions')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (fallbackError) {
                    console.error('Fallback error:', fallbackError);
                    console.error('Full fallback error details:', JSON.stringify(fallbackError, null, 2));
                    toast.error(`Failed to load candidates: ${fallbackError.message || 'Database error'}`);
                    return;
                }

                // Filter submissions for this company's jobs
                const { data: companyJobs } = await supabase
                    .from('Jobs')
                    .select('id, job_title')
                    .eq('company_id', company.id);

                const companyJobIds = companyJobs?.map(job => job.id) || [];
                const filteredSubmissions = allSubmissions?.filter(sub => 
                    companyJobIds.includes(sub.job_id)
                ) || [];

                // Add job details to submissions
                const submissionsWithJobs = filteredSubmissions.map(sub => {
                    const job = companyJobs?.find(job => job.id === sub.job_id);
                    return {
                        ...sub,
                        Jobs: job
                    };
                });

                await enrichCandidatesWithUserData(submissionsWithJobs);
                return;
            }

            await enrichCandidatesWithUserData(submissions || []);
        } catch (error) {
            console.error('Exception fetching candidates:', error);
            console.error('Full exception details:', JSON.stringify(error, null, 2));

            // Final fallback: try using the view if it exists
            try {
                console.log('Attempting final fallback using Company_Candidates_View...');
                const { data: viewData, error: viewError } = await supabase
                    .from('Company_Candidates_View')
                    .select('*')
                    .eq('company_id', company.id)
                    .order('created_at', { ascending: false });

                if (!viewError && viewData) {
                    console.log('Successfully loaded candidates from view:', viewData.length);
                    const formattedData = viewData.map(item => ({
                        ...item,
                        user: {
                            id: item.user_id,
                            name: item.user_name || 'Unknown Candidate',
                            email: item.user_email || 'No email',
                            cv_url: item.cv_url,
                            cv_filename: item.cv_filename,
                            cv_uploaded_at: item.cv_uploaded_at
                        },
                        Jobs: {
                            id: item.job_id,
                            job_title: item.job_title
                        },
                        cv_screened: !!item.match_score,
                        screening_result: item.match_score ? {
                            match_score: item.match_score,
                            summary: item.screening_summary
                        } : null
                    }));
                    setCandidates(formattedData);
                    return;
                }
            } catch (viewError) {
                console.error('View fallback also failed:', viewError);
            }

            toast.error(`Failed to load candidates: ${error.message || 'Database connection error'}`);
        } finally {
            setLoading(false);
        }
    };

    const enrichCandidatesWithUserData = async (submissions) => {
        // Get unique user emails/IDs
        const userEmails = [...new Set(submissions.map(sub => sub.user_email).filter(Boolean))];
        const userIds = [...new Set(submissions.map(sub => sub.user_id).filter(Boolean))];

        let users = [];

        // Fetch user data by email if available
        if (userEmails.length > 0) {
            const { data: usersByEmail } = await supabase
                .from('Users')
                .select('*')
                .in('email', userEmails);
            users = users.concat(usersByEmail || []);
        }

        // Fetch user data by ID if available
        if (userIds.length > 0) {
            const { data: usersById } = await supabase
                .from('Users')
                .select('*')
                .in('id', userIds);
            users = users.concat(usersById || []);
        }

        // Combine submission data with user data
        const enrichedCandidates = submissions.map(submission => {
            const user = users.find(u => 
                u.email === submission.user_email || u.id === submission.user_id
            );

            return {
                ...submission,
                user: user || {
                    name: submission.user_name || 'Unknown Candidate',
                    email: submission.user_email || 'No email',
                    cv_url: null,
                    cv_filename: null
                }
            };
        });

        setCandidates(enrichedCandidates);
    };

    const getStatusBadge = (submission) => {
        if (submission.application_status === 'accepted') {
            return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
        } else if (submission.application_status === 'rejected') {
            return <Badge variant="destructive">Rejected</Badge>;
        } else if (submission.interview_completed) {
            return <Badge className="bg-blue-100 text-blue-800">Interview Completed</Badge>;
        } else {
            return <Badge variant="secondary">Pending</Badge>;
        }
    };

    const filteredCandidates = candidates.filter(candidate => {
        const matchesSearch = 
            candidate.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            candidate.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            candidate.Jobs?.job_title?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        switch (filter) {
            case 'with_cv':
                return candidate.user?.cv_url;
            case 'pending':
                return candidate.application_status === 'pending' || !candidate.application_status;
            case 'screened':
                return candidate.cv_screened;
            default:
                return true;
        }
    });

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="text-center py-12">
                    <p>Loading candidates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Candidates</h1>
                    <p className="text-gray-600">Manage job applicants and screen CVs</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search candidates..."
                            className="pl-8 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                <Button 
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    size="sm"
                >
                    All ({candidates.length})
                </Button>
                <Button 
                    variant={filter === 'with_cv' ? 'default' : 'outline'}
                    onClick={() => setFilter('with_cv')}
                    size="sm"
                >
                    With CV ({candidates.filter(c => c.user?.cv_url).length})
                </Button>
                <Button 
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    onClick={() => setFilter('pending')}
                    size="sm"
                >
                    Pending ({candidates.filter(c => c.application_status === 'pending' || !c.application_status).length})
                </Button>
                <Button 
                    variant={filter === 'screened' ? 'default' : 'outline'}
                    onClick={() => setFilter('screened')}
                    size="sm"
                >
                    Screened ({candidates.filter(c => c.cv_screened).length})
                </Button>
            </div>

            {/* Candidates List */}
            {filteredCandidates.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <User className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Candidates Found</h3>
                        <p className="text-gray-500 text-center">
                            {filter === 'all' 
                                ? "No candidates have applied for your jobs yet."
                                : `No candidates match the ${filter} filter.`
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {filteredCandidates.map((candidate) => (
                            <Card 
                                key={candidate.id} 
                                className={`cursor-pointer transition-shadow hover:shadow-md ${
                                    selectedCandidate?.id === candidate.id ? 'ring-2 ring-blue-500' : ''
                                }`}
                                onClick={() => setSelectedCandidate(candidate)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <User className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{candidate.user?.name}</h3>
                                                <p className="text-sm text-gray-600">{candidate.user?.email}</p>
                                                <p className="text-sm text-blue-600 mt-1">
                                                    Applied for: {candidate.Jobs?.job_title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    {getStatusBadge(candidate)}
                                                    {candidate.user?.cv_url && (
                                                        <Badge variant="outline" className="text-green-600">
                                                            <FileText className="h-3 w-3 mr-1" />
                                                            CV Available
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(candidate.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Candidate Details Panel */}
                    <div className="lg:sticky lg:top-4">
                        {selectedCandidate ? (
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Candidate Details</CardTitle>
                                        <CardDescription>
                                            {selectedCandidate.user?.name} • {selectedCandidate.Jobs?.job_title}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium">Email</label>
                                                <p className="text-sm text-gray-600">{selectedCandidate.user?.email}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Application Date</label>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(selectedCandidate.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Status</label>
                                                <div className="mt-1">
                                                    {getStatusBadge(selectedCandidate)}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* CV Screening Component */}
                                {selectedCandidate.user?.cv_url && (
                                    <CVScreening 
                                        user={selectedCandidate.user}
                                        company={company}
                                        job={selectedCandidate.Jobs}
                                        onScreeningComplete={(result) => {
                                            // Update the candidate with screening result
                                            setCandidates(prev => prev.map(c => 
                                                c.id === selectedCandidate.id 
                                                    ? { ...c, cv_screened: true, screening_result: result }
                                                    : c
                                            ));
                                        }}
                                    />
                                )}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <User className="h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Select a Candidate</h3>
                                    <p className="text-gray-500 text-center">
                                        Click on a candidate to view their details and screen their CV
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CandidatesPage;
