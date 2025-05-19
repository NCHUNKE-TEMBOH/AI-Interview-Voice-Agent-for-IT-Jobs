"use client"
import { useUser } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/services/supabaseClient';
import { BriefcaseBusiness, Calendar, Edit, ExternalLink, MapPin, MoreHorizontal, Plus, Search, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

function JobsPage() {
  const { company } = useUser();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (company) {
      fetchJobs();
    }
  }, [company]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Check if company exists and has an ID
      if (!company || !company.id) {
        console.error('Company data is missing or invalid');
        toast.error('Company profile not found. Please complete your profile first.');
        setJobs([]);
        return;
      }

      console.log('Fetching jobs for company ID:', company.id);

      // Step 1: Fetch jobs without the relationship
      const { data: jobsData, error: jobsError } = await supabase
        .from('Jobs')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Supabase error fetching jobs:', jobsError);
        toast.error(`Failed to load jobs: ${jobsError.message || 'Database error'}`);
        setJobs([]);
        return;
      }

      console.log('Jobs fetched successfully:', jobsData?.length || 0, 'jobs found');

      // Step 2: If we have jobs, fetch submission counts separately
      if (jobsData && jobsData.length > 0) {
        try {
          // Get all job IDs
          const jobIds = jobsData.map(job => job.id);

          // Fetch submission counts for each job
          const { data: submissionCounts, error: submissionsError } = await supabase
            .from('Job_Submissions')
            .select('job_id, count')
            .in('job_id', jobIds)
            .group('job_id');

          if (submissionsError) {
            console.warn('Error fetching submission counts:', submissionsError);
            // Continue without submission counts
          } else if (submissionCounts) {
            // Create a map of job_id to count
            const countsMap = {};
            submissionCounts.forEach(item => {
              countsMap[item.job_id] = parseInt(item.count) || 0;
            });

            // Add submission counts to jobs
            jobsData.forEach(job => {
              job.submissionCount = countsMap[job.id] || 0;
            });
          }
        } catch (countError) {
          console.warn('Exception fetching submission counts:', countError);
          // Continue without submission counts
        }
      }

      setJobs(jobsData || []);
    } catch (error) {
      console.error('Exception fetching jobs:', error);
      toast.error(`Failed to load jobs: ${error.message || 'Unknown error'}`);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      // Delete job
      const { error } = await supabase
        .from('Jobs')
        .delete()
        .eq('id', jobToDelete.id);

      if (error) throw error;

      // Update local state
      setJobs(jobs.filter(job => job.id !== jobToDelete.id));
      toast.success('Job deleted successfully');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    } finally {
      setJobToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.job_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isJobActive = (deadline) => {
    return new Date(deadline) >= new Date();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Job Listings</h1>
        <Link href="/company/create-job">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Job
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search jobs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p>Loading jobs...</p>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className={!isJobActive(job.application_deadline) ? "border-gray-200 bg-gray-50" : ""}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-semibold">{job.job_title}</h2>
                      {!isJobActive(job.application_deadline) && (
                        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">Expired</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <BriefcaseBusiness className="mr-1 h-4 w-4" />
                        {job.employment_type}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-4 w-4" />
                        {job.location_type}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        {job.submissionCount || 0} Submissions
                      </div>
                    </div>

                    <p className="text-gray-700 line-clamp-2 mb-4">
                      {job.job_description}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 mt-4 md:mt-0 justify-end">
                    <Link href={`/company/jobs/${job.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>

                    <Link href={`/jobs/${job.id}`} target="_blank">
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setJobToDelete(job);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BriefcaseBusiness className="h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No jobs found</h2>
            <p className="text-gray-500 text-center mb-6">
              {searchQuery
                ? "No jobs match your search criteria"
                : "You haven't created any jobs yet"}
            </p>
            {!searchQuery && (
              <Link href="/company/create-job">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Job
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{jobToDelete?.job_title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteJob}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default JobsPage;
