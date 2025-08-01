"use client"
import { useUser } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmploymentTypes, ExperienceLevels, InterviewType, LocationTypes } from '@/services/Constants';
import { supabase } from '@/services/supabaseClient';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';

function CreateJob() {
  const { company } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    job_title: '',
    employment_type: '',
    location_type: '',
    salary_range: '',
    application_deadline: '',
    job_start_date: '',
    job_description: '',
    experience_level: '',
    required_skills: '',
    ai_criteria: '',
    question_count: '10',
    interview_type: []
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addInterviewType = (type) => {
    const currentTypes = [...formData.interview_type];
    if (currentTypes.includes(type)) {
      // Remove if already selected
      handleInputChange('interview_type', currentTypes.filter(t => t !== type));
    } else {
      // Add if not selected
      handleInputChange('interview_type', [...currentTypes, type]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Format interview types as a comma-separated string
      const interviewTypes = formData.interview_type.join(', ');
      
      // Insert job into database
      const { data, error } = await supabase
        .from('Jobs')
        .insert([
          {
            company_id: company.id,
            job_title: formData.job_title,
            employment_type: formData.employment_type,
            location_type: formData.location_type,
            salary_range: formData.salary_range,
            application_deadline: formData.application_deadline,
            job_start_date: formData.job_start_date,
            job_description: formData.job_description,
            experience_level: formData.experience_level,
            required_skills: formData.required_skills,
            ai_criteria: formData.ai_criteria,
            question_count: parseInt(formData.question_count),
            interview_type: interviewTypes
          }
        ])
        .select();
      
      if (error) throw error;
      
      toast.success('Job created successfully!');
      setStep(2);
      
      // Redirect to jobs page after a delay
      setTimeout(() => {
        router.push('/company/jobs');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    // Check required fields
    const requiredFields = [
      'job_title', 'employment_type', 'location_type', 
      'application_deadline', 'job_description', 
      'experience_level', 'required_skills'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`Please fill in the ${field.replace('_', ' ')}`);
        return false;
      }
    }
    
    // Check if at least one interview type is selected
    if (formData.interview_type.length === 0) {
      toast.error('Please select at least one interview type');
      return false;
    }
    
    return true;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Create New Job</h1>
      </div>
      
      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              Fill in the details for your new job posting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input 
                    id="job_title" 
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select 
                    value={formData.experience_level}
                    onValueChange={(value) => handleInputChange('experience_level', value)}
                    required
                  >
                    <SelectTrigger id="experience_level">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {ExperienceLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select 
                    value={formData.employment_type}
                    onValueChange={(value) => handleInputChange('employment_type', value)}
                    required
                  >
                    <SelectTrigger id="employment_type">
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EmploymentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location_type">Location Type</Label>
                  <Select 
                    value={formData.location_type}
                    onValueChange={(value) => handleInputChange('location_type', value)}
                    required
                  >
                    <SelectTrigger id="location_type">
                      <SelectValue placeholder="Select location type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LocationTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salary_range">Salary Range (Optional)</Label>
                  <Input 
                    id="salary_range" 
                    value={formData.salary_range}
                    onChange={(e) => handleInputChange('salary_range', e.target.value)}
                    placeholder="e.g. $80,000 - $100,000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="application_deadline">Application Deadline</Label>
                  <Input 
                    id="application_deadline" 
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="job_start_date">Job Start Date (Optional)</Label>
                  <Input 
                    id="job_start_date" 
                    type="date"
                    value={formData.job_start_date}
                    onChange={(e) => handleInputChange('job_start_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="question_count">Number of Interview Questions</Label>
                  <Select 
                    value={formData.question_count}
                    onValueChange={(value) => handleInputChange('question_count', value)}
                    required
                  >
                    <SelectTrigger id="question_count">
                      <SelectValue placeholder="Select number of questions" />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20].map((count) => (
                        <SelectItem key={count} value={count.toString()}>
                          {count} Questions
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label>Interview Types</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {InterviewType.map((type) => (
                      <Button
                        key={type.title}
                        type="button"
                        variant={formData.interview_type.includes(type.title) ? "default" : "outline"}
                        onClick={() => addInterviewType(type.title)}
                        className="flex items-center gap-2"
                      >
                        <type.icon className="h-4 w-4" />
                        {type.title}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="job_description">Job Description</Label>
                  <Textarea 
                    id="job_description" 
                    value={formData.job_description}
                    onChange={(e) => handleInputChange('job_description', e.target.value)}
                    placeholder="Describe the job responsibilities, requirements, and any other relevant details"
                    className="min-h-[120px]"
                    required
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="required_skills">Required Skills</Label>
                  <Textarea 
                    id="required_skills" 
                    value={formData.required_skills}
                    onChange={(e) => handleInputChange('required_skills', e.target.value)}
                    placeholder="List the required skills, separated by commas"
                    className="min-h-[80px]"
                    required
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ai_criteria">AI Interview Criteria</Label>
                  <Textarea 
                    id="ai_criteria" 
                    value={formData.ai_criteria}
                    onChange={(e) => handleInputChange('ai_criteria', e.target.value)}
                    placeholder="Describe what you want the AI to look for in candidates during the interview"
                    className="min-h-[120px]"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Job'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Job Created Successfully!</h2>
            <p className="text-gray-500 text-center mb-6">
              Your job has been posted and is now available for candidates to apply.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => router.push('/company/jobs')}>
                View All Jobs
              </Button>
              <Button variant="outline" onClick={() => {
                setFormData({
                  job_title: '',
                  employment_type: '',
                  location_type: '',
                  salary_range: '',
                  application_deadline: '',
                  job_start_date: '',
                  job_description: '',
                  experience_level: '',
                  required_skills: '',
                  ai_criteria: '',
                  question_count: '10',
                  interview_type: []
                });
                setStep(1);
              }}>
                Create Another Job
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CreateJob;
