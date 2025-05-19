"use client"
import { useUser } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/services/supabaseClient';
import { Calendar, CheckCircle, ClipboardList, Search, ThumbsDown, ThumbsUp, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

function SubmissionsPage() {
  const { company } = useUser();
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  useEffect(() => {
    if (company) {
      fetchJobs();
      fetchSubmissions();
    }
  }, [company]);

  const fetchJobs = async () => {
    try {
      // Check if company exists and has an ID
      if (!company || !company.id) {
        console.error('Company data is missing or invalid');
        setJobs([]);
        return;
      }

      console.log('Fetching jobs for company ID:', company.id);

      const { data, error } = await supabase
        .from('Jobs')
        .select('id, job_title')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        toast.error(`Failed to load jobs: ${error.message || 'Database error'}`);
        setJobs([]);
        return;
      }

      console.log('Jobs fetched successfully:', data?.length || 0, 'jobs found');
      setJobs(data || []);
    } catch (error) {
      console.error('Exception fetching jobs:', error);
      toast.error(`Failed to load jobs: ${error.message || 'Unknown error'}`);
      setJobs([]);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // Check if company exists and has an ID
      if (!company || !company.id) {
        console.error('Company data is missing or invalid');
        toast.error('Company profile not found. Please complete your profile first.');
        setSubmissions([]);
        setLoading(false);
        return;
      }

      console.log('Fetching submissions for company ID:', company.id);

      // Step 1: First get all jobs for this company
      const { data: companyJobs, error: jobsError } = await supabase
        .from('Jobs')
        .select('id, job_title')
        .eq('company_id', company.id);

      if (jobsError) {
        console.error('Error fetching company jobs:', jobsError);
        toast.error(`Failed to load company jobs: ${jobsError.message || 'Database error'}`);
        setSubmissions([]);
        setLoading(false);
        return;
      }

      console.log('Company jobs fetched:', companyJobs?.length || 0, 'jobs found');

      if (!companyJobs || companyJobs.length === 0) {
        console.log('No jobs found for this company, no submissions to fetch');
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // Step 2: Get job IDs
      const jobIds = companyJobs.map(job => job.id);

      // Step 3: Fetch submissions for these jobs
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('Job_Submissions')
        .select('*')
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        toast.error(`Failed to load submissions: ${submissionsError.message || 'Database error'}`);
        setSubmissions([]);
        setLoading(false);
        return;
      }

      console.log('Submissions fetched:', submissionsData?.length || 0, 'submissions found');

      // Step 4: Create a map of job IDs to job details
      const jobMap = {};
      companyJobs.forEach(job => {
        jobMap[job.id] = job;
      });

      // Step 5: Combine submissions with job details
      const enhancedSubmissions = submissionsData.map(submission => ({
        ...submission,
        Jobs: jobMap[submission.job_id] || { id: submission.job_id, job_title: 'Unknown Job' }
      }));

      setSubmissions(enhancedSubmissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error(`Failed to load submissions: ${error.message || 'Unknown error'}`);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (submissionId, status) => {
    try {
      const { error } = await supabase
        .from('Job_Submissions')
        .update({ status })
        .eq('id', submissionId);

      if (error) throw error;

      // Update local state
      setSubmissions(submissions.map(sub =>
        sub.id === submissionId ? { ...sub, status } : sub
      ));

      // Close dialog if open
      setFeedbackDialogOpen(false);

      toast.success(`Candidate ${status === 'accepted' ? 'accepted' : 'rejected'}`);
    } catch (error) {
      console.error('Error updating submission status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    let matchesJob = true;
    let matchesStatus = true;

    if (selectedJob !== 'all') {
      // Handle both string and number job IDs
      const jobId = submission.Jobs?.id;
      const selectedJobId = selectedJob;

      // Convert both to strings for comparison
      matchesJob = String(jobId) === String(selectedJobId);
    }

    if (selectedStatus !== 'all') {
      matchesStatus = submission.status === selectedStatus;
    }

    return matchesJob && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClipboardList className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Interview Submissions</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Filter by Job</label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="All Jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.job_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Filter by Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p>Loading submissions...</p>
        </div>
      ) : filteredSubmissions.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-semibold">{submission.user_name}</h2>
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${getStatusBadgeClass(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Job:</span> {submission.Jobs.job_title}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {submission.user_email}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Match Score</span>
                        <span className="text-sm font-medium">
                          {submission.feedback?.matchScore || 0}%
                        </span>
                      </div>
                      <Progress value={submission.feedback?.matchScore || 0} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Technical Skills</div>
                        <div className="text-lg font-semibold">
                          {submission.feedback?.rating?.technicalSkills || 0}/10
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Communication</div>
                        <div className="text-lg font-semibold">
                          {submission.feedback?.rating?.communication || 0}/10
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Problem Solving</div>
                        <div className="text-lg font-semibold">
                          {submission.feedback?.rating?.problemSolving || 0}/10
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Experience</div>
                        <div className="text-lg font-semibold">
                          {submission.feedback?.rating?.experience || 0}/10
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 mt-4 md:mt-0 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentSubmission(submission);
                        setFeedbackDialogOpen(true);
                      }}
                    >
                      View Details
                    </Button>

                    {submission.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                          onClick={() => updateSubmissionStatus(submission.id, 'accepted')}
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Accept
                        </Button>

                        <Button
                          variant="outline"
                          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                          onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                        >
                          <ThumbsDown className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No submissions found</h2>
            <p className="text-gray-500 text-center">
              {selectedJob !== 'all' || selectedStatus !== 'all'
                ? "No submissions match your filter criteria"
                : "You haven't received any interview submissions yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Interview Feedback</DialogTitle>
            <DialogDescription>
              Detailed AI feedback for {currentSubmission?.user_name}
            </DialogDescription>
          </DialogHeader>

          {currentSubmission && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{currentSubmission.user_name}</h3>
                  <p className="text-sm text-gray-500">{currentSubmission.user_email}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${getStatusBadgeClass(currentSubmission.status)}`}>
                  {currentSubmission.status.charAt(0).toUpperCase() + currentSubmission.status.slice(1)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Job Position</h4>
                <p>{currentSubmission.Jobs.job_title}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Interview Date</h4>
                <p>{new Date(currentSubmission.created_at).toLocaleString()}</p>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Overall Rating</h4>
                <div className="flex items-center gap-2">
                  <Progress
                    value={currentSubmission.feedback?.rating?.totalRating * 10 || 0}
                    className="h-2 flex-1"
                  />
                  <span className="font-semibold">
                    {currentSubmission.feedback?.rating?.totalRating || 0}/10
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Match Score</h4>
                <div className="flex items-center gap-2">
                  <Progress
                    value={currentSubmission.feedback?.matchScore || 0}
                    className="h-2 flex-1"
                  />
                  <span className="font-semibold">
                    {currentSubmission.feedback?.matchScore || 0}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Technical Skills</h4>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={currentSubmission.feedback?.rating?.technicalSkills * 10 || 0}
                      className="h-2 flex-1"
                    />
                    <span className="font-semibold">
                      {currentSubmission.feedback?.rating?.technicalSkills || 0}/10
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Communication</h4>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={currentSubmission.feedback?.rating?.communication * 10 || 0}
                      className="h-2 flex-1"
                    />
                    <span className="font-semibold">
                      {currentSubmission.feedback?.rating?.communication || 0}/10
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Problem Solving</h4>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={currentSubmission.feedback?.rating?.problemSolving * 10 || 0}
                      className="h-2 flex-1"
                    />
                    <span className="font-semibold">
                      {currentSubmission.feedback?.rating?.problemSolving || 0}/10
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Experience</h4>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={currentSubmission.feedback?.rating?.experience * 10 || 0}
                      className="h-2 flex-1"
                    />
                    <span className="font-semibold">
                      {currentSubmission.feedback?.rating?.experience || 0}/10
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2">Summary</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  {currentSubmission.feedback?.summary?.map((line, index) => (
                    <p key={index} className="mb-2">{line}</p>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Recommendation</h4>
                <div className={`p-4 rounded-md ${currentSubmission.feedback?.recommendation ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {currentSubmission.feedback?.recommendation ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-semibold">
                      {currentSubmission.feedback?.recommendation ? 'Recommended' : 'Not Recommended'}
                    </span>
                  </div>
                  <p>{currentSubmission.feedback?.recommendationMsg}</p>
                </div>
              </div>

              {currentSubmission.status === 'pending' && (
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    variant="outline"
                    className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                    onClick={() => updateSubmissionStatus(currentSubmission.id, 'rejected')}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Reject
                  </Button>

                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateSubmissionStatus(currentSubmission.id, 'accepted')}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SubmissionsPage;
