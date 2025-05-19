"use client"
import { useUser } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/services/supabaseClient';
import { BriefcaseBusiness, Clock, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

function CompanyDashboard() {
  const { company } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalSubmissions: 0,
    pendingReview: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company) {
      fetchDashboardData();
    }
  }, [company]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('Jobs')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Fetch submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('Job_Submissions')
        .select('*, Jobs!inner(*)')
        .eq('Jobs.company_id', company.id);

      if (submissionsError) throw submissionsError;

      // Calculate stats
      const now = new Date();
      const activeJobs = jobs.filter(job => new Date(job.application_deadline) >= now);
      const pendingReview = submissions.filter(sub => sub.status === 'pending');

      setStats({
        totalJobs: jobs.length,
        activeJobs: activeJobs.length,
        totalSubmissions: submissions.length,
        pendingReview: pendingReview.length
      });

      // Set recent jobs (limit to 3)
      setRecentJobs(jobs.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className='my-3 font-bold text-2xl'>Company Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full bg-blue-100 p-3 mb-4">
              <BriefcaseBusiness className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">{stats.totalJobs}</h3>
            <p className="text-sm text-gray-500">Total Jobs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold">{stats.activeJobs}</h3>
            <p className="text-sm text-gray-500">Active Jobs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full bg-purple-100 p-3 mb-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold">{stats.totalSubmissions}</h3>
            <p className="text-sm text-gray-500">Total Submissions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="rounded-full bg-amber-100 p-3 mb-4">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold">{stats.pendingReview}</h3>
            <p className="text-sm text-gray-500">Pending Review</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Jobs */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>Your most recently posted job listings</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Loading...</p>
          ) : recentJobs.length > 0 ? (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{job.job_title}</h3>
                      <p className="text-sm text-gray-500">{job.employment_type} • {job.location_type}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link href={`/company/jobs/${job.id}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't posted any jobs yet</p>
              <Link href="/company/create-job">
                <Button>Create Your First Job</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/company/create-job">
              <Button className="w-full" size="lg">
                <BriefcaseBusiness className="mr-2 h-4 w-4" />
                Post New Job
              </Button>
            </Link>
            <Link href="/company/submissions">
              <Button className="w-full" variant="outline" size="lg">
                <FileText className="mr-2 h-4 w-4" />
                Review Submissions
              </Button>
            </Link>
            <Link href="/company/profile">
              <Button className="w-full" variant="outline" size="lg">
                <Users className="mr-2 h-4 w-4" />
                Update Company Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CompanyDashboard;
