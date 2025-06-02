"use client"
import { useUser } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/services/supabaseClient';
import { BriefcaseBusiness, Building2, Calendar, Clock, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useUser();

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);

            // First, try to fetch jobs with company relationship
            let { data, error } = await supabase
                .from('Jobs')
                .select(`
                    *,
                    Companies!Jobs_company_id_fkey(name, picture, industry_type)
                `)
                .order('created_at', { ascending: false });

            // If foreign key relationship fails, try the other foreign key name
            if (error && (error.code === 'PGRST200' || error.code === 'PGRST201')) {
                console.log("Trying alternative foreign key relationship...");

                const { data: altData, error: altError } = await supabase
                    .from('Jobs')
                    .select(`
                        *,
                        Companies!jobs_company_id_fkey(name, picture, industry_type)
                    `)
                    .order('created_at', { ascending: false });

                if (!altError) {
                    data = altData;
                    error = null;
                } else {
                    console.log("Alternative foreign key also failed, fetching separately...");
                }
            }

            // If both foreign key relationships fail, fetch jobs and companies separately
            if (error && (error.code === 'PGRST200' || error.code === 'PGRST201')) {

                // Fetch jobs without company relationship
                const { data: jobsData, error: jobsError } = await supabase
                    .from('Jobs')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (jobsError) {
                    console.error("Error fetching jobs:", jobsError);
                    console.error("Full error details:", JSON.stringify(jobsError, null, 2));
                    setJobs([]);
                    return;
                }

                if (!jobsData || jobsData.length === 0) {
                    setJobs([]);
                    return;
                }

                // Fetch company details for each job
                const jobsWithCompanies = await Promise.all(
                    jobsData.map(async (job) => {
                        try {
                            const { data: company, error: companyError } = await supabase
                                .from('Companies')
                                .select('name, picture, industry_type')
                                .eq('id', job.company_id)
                                .single();

                            if (companyError) {
                                console.error(`Error fetching company for job ${job.id}:`, companyError);
                                return {
                                    ...job,
                                    Companies: null
                                };
                            }

                            return {
                                ...job,
                                Companies: company
                            };
                        } catch (error) {
                            console.error(`Exception fetching company for job ${job.id}:`, error);
                            return {
                                ...job,
                                Companies: null
                            };
                        }
                    })
                );

                data = jobsWithCompanies;
            } else if (error) {
                console.error("Error fetching jobs:", error);
                console.error("Full error details:", JSON.stringify(error, null, 2));
                setJobs([]);
                return;
            }

            console.log("Fetched jobs:", data);
            setJobs(data || []);
        } catch (error) {
            console.error("Exception fetching jobs:", error);
            console.error("Full exception details:", JSON.stringify(error, null, 2));
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job => 
        job.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.Companies?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.job_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.employment_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Find Jobs</h1>
                <div className="relative w-1/3">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search jobs..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                    <BriefcaseBusiness className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">No jobs found</h2>
                    <p className="text-muted-foreground">
                        {searchTerm ? "Try a different search term" : "Check back later for new job postings"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                        <Card key={job.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{job.job_title}</CardTitle>
                                        <CardDescription className="flex items-center mt-1">
                                            <Building2 className="h-4 w-4 mr-1" />
                                            {job.Companies?.name || "Company"}
                                        </CardDescription>
                                    </div>
                                    {job.Companies?.picture && (
                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                            <img 
                                                src={job.Companies.picture} 
                                                alt={job.Companies.name} 
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <div className="flex flex-wrap gap-2 mb-3">
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
                                    {job.application_deadline && (
                                        <Badge variant="outline" className="flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            Due: {new Date(job.application_deadline).toLocaleDateString()}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-3">
                                    {job.job_description || "No description provided."}
                                </p>
                            </CardContent>
                            <CardFooter className="pt-2">
                                <Link href={`/jobs/${job.id}`} className="w-full">
                                    <Button className="w-full">Apply with AI Interview</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default JobsPage;
