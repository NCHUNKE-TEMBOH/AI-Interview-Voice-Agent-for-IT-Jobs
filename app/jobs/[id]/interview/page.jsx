"use client"
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/services/supabaseClient';
import { ArrowLeft, CheckCircle, Info, Loader2Icon, Mic, Phone, Timer } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Vapi from "@vapi-ai/web";
import AlertConfirmation from '@/app/interview/_components/AlertConfirmation';
import TimerComponent from '@/app/interview/[interview_id]/start/_components/TimerComponent';
import axios from 'axios';

function JobInterview() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [step, setStep] = useState(1);
  const [callEnd, setCallEnd] = useState(false);
  const [activeUser, setActiveUser] = useState(false);
  const [conversation, setConversation] = useState();
  const [processingFeedback, setProcessingFeedback] = useState(false);
  
  // Initialize Vapi
  const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      // Get job details
      const { data: jobData, error: jobError } = await supabase
        .from('Jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (jobError) throw jobError;
      
      setJob(jobData);
      
      // Get company details
      if (jobData.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('Companies')
          .select('*')
          .eq('id', jobData.company_id)
          .single();
        
        if (companyError) throw companyError;
        
        setCompany(companyData);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const startInterview = () => {
    if (!userName || !userEmail) {
      toast.error('Please enter your name and email');
      return;
    }
    
    setStep(2);
    startCall();
  };

  const startCall = () => {
    // Format the interview types for the AI
    const interviewTypes = job.interview_type ? job.interview_type.split(',').map(type => type.trim()).join(', ') : 'General';
    
    // Create a list of questions based on the job's question_count
    const questionCount = job.question_count || 10;
    
    const assistantOptions = {
      name: "AI Interviewer",
      firstMessage: `Hi ${userName}, welcome to your interview for the ${job.job_title} position at ${company?.name}. I'll be asking you some questions to assess your fit for this role. Are you ready to begin?`,
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
      voice: {
        provider: "playht",
        voiceId: "jennifer",
      },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `
You are an AI voice assistant conducting interviews for a ${job.job_title} position at ${company?.name}.

Job Description: ${job.job_description}

Required Skills: ${job.required_skills}

Experience Level: ${job.experience_level}

Interview Types: ${interviewTypes}

Company Criteria: ${job.ai_criteria}

Your job is to ask candidates interview questions, assess their responses based on the company's criteria.

Begin the conversation with a friendly introduction, setting a relaxed yet professional tone.

Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise.

Generate approximately ${questionCount} questions that cover the required skills and experience for this position.

If the candidate struggles, offer hints or rephrase the question without giving away the answer.

At the end of the interview, thank the candidate and let them know that their results will be sent to the company for review.

✅ Ensure the interview remains focused on the job requirements and company criteria.
`.trim(),
          },
        ],
      },
    };

    vapi.start(assistantOptions);
    setCallEnd(false);

    // Set up event listeners
    vapi.on("call-start", () => {
      console.log("Call has started.");
      toast('Call Connected...');
    });
    
    vapi.on("speech-start", () => {
      console.log("Assistant speech has started.");
      setActiveUser(false);
    });
    
    vapi.on("speech-end", () => {
      console.log("Assistant speech has ended.");
      setActiveUser(true);
    });
    
    vapi.on("call-end", () => {
      console.log("Call has ended.");
      toast('Interview Ended... Please Wait...');
      setCallEnd(true);
      generateFeedback();
    });
    
    vapi.on("message", (message) => {
      console.log(message?.conversation);
      setConversation(JSON.stringify(message?.conversation));
    });
  };

  const stopInterview = () => {
    vapi.stop();
    console.log("STOP...");
    setCallEnd(true);
    generateFeedback();
  };

  const generateFeedback = async () => {
    if (!conversation) {
      toast.error('No conversation data available');
      return;
    }
    
    setProcessingFeedback(true);
    
    try {
      // Send conversation to AI for feedback
      const result = await axios.post('/api/ai-feedback', {
        conversation: conversation,
        jobTitle: job.job_title,
        jobDescription: job.job_description,
        requiredSkills: job.required_skills,
        companyCriteria: job.ai_criteria
      });
      
      const Content = result.data.content;
      const FINAL_CONTENT = Content.replace('```json', '').replace('```', '');
      
      // Save feedback to database
      const { data, error } = await supabase
        .from('Job_Submissions')
        .insert([
          {
            job_id: job.id,
            user_name: userName,
            user_email: userEmail,
            feedback: JSON.parse(FINAL_CONTENT),
            status: 'pending',
            score: JSON.parse(FINAL_CONTENT).feedback.matchScore || 0
          },
        ])
        .select();
      
      if (error) throw error;
      
      // Move to completion step
      setStep(3);
    } catch (error) {
      console.error('Error generating feedback:', error);
      toast.error('Failed to process interview feedback');
    } finally {
      setProcessingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <p>Loading job details...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      {step === 1 && (
        <>
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job
          </Button>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">AI Interview for {job.job_title}</h1>
                <p className="text-gray-600">at {company?.name}</p>
              </div>
              
              <div className="max-w-md mx-auto space-y-6">
                <div>
                  <h2 className="text-sm font-medium mb-2">Enter your full name</h2>
                  <Input 
                    placeholder="e.g. John Smith" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)} 
                  />
                </div>
                
                <div>
                  <h2 className="text-sm font-medium mb-2">Enter your email</h2>
                  <Input 
                    placeholder="e.g. john@example.com" 
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)} 
                  />
                </div>
                
                <div className="p-3 bg-blue-100 flex gap-4 rounded-lg">
                  <Info className="text-primary flex-shrink-0" />
                  <div>
                    <h2 className="font-bold">Before you begin</h2>
                    <ul className="">
                      <li className="text-sm text-primary">- Test your camera and microphone</li>
                      <li className="text-sm text-primary">- Ensure you have a stable internet connection</li>
                      <li className="text-sm text-primary">- Find a quiet place for the interview</li>
                    </ul>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={startInterview}
                >
                  Start Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      
      {step === 2 && (
        <div>
          <div className='flex justify-between items-center'>
            <h2 className='font-bold text-2xl'>{job.job_title} Interview</h2>
            <div className='flex gap-3 items-center'>
              <TimerComponent />
              <AlertConfirmation onConfirm={stopInterview} />
            </div>
          </div>
          
          <div className='grid grid-cols-1 md:grid-cols-2 gap-7 mt-5'>
            <div className='bg-white h-[400px] rounded-lg border flex relative flex-col gap-3 items-center justify-center'>
              <div className='relative'>
                {!activeUser && <span className="absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping" />}
                <Image src={'/ai.png'} alt='ai'
                  width={100}
                  height={100}
                  className='w-[60px] h-[60px] rounded-full object-cover'
                />
              </div>
              <h2>AI Interviewer</h2>
            </div>
            
            <div className='bg-white h-[400px] rounded-lg border flex flex-col gap-3 items-center justify-center'>
              <div className='relative'>
                {activeUser && <span className="absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping" />}
                <div className='w-[60px] h-[60px] rounded-full bg-gray-200 flex items-center justify-center'>
                  <Mic className='text-gray-600' />
                </div>
              </div>
              <h2>{userName}</h2>
            </div>
          </div>
          
          {callEnd && (
            <div className='mt-5 flex justify-center'>
              <div className='bg-white p-5 rounded-lg border w-full max-w-md text-center'>
                <h2 className='font-bold text-xl mb-3'>Interview Completed</h2>
                <p className='text-gray-500 mb-4'>
                  Thank you for completing the interview. We are now processing your responses.
                </p>
                {processingFeedback ? (
                  <div className='flex items-center justify-center gap-2'>
                    <Loader2Icon className='animate-spin' />
                    <span>Processing your feedback...</span>
                  </div>
                ) : (
                  <Button onClick={() => router.push('/jobs')}>
                    Return to Jobs
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {step === 3 && (
        <div className='flex justify-center items-center min-h-[60vh]'>
          <Card className='max-w-md w-full'>
            <CardContent className='p-6 text-center'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <CheckCircle className='text-green-600 h-8 w-8' />
              </div>
              
              <h2 className='text-2xl font-bold mb-2'>Interview Completed</h2>
              
              <p className='text-gray-600 mb-6'>
                Thank you for completing your interview for the {job.job_title} position at {company?.name}. 
                Your responses have been recorded and will be reviewed by the hiring team.
              </p>
              
              <p className='text-gray-600 mb-6'>
                You will be notified via email at {userEmail} if you are selected to move forward in the hiring process.
              </p>
              
              <Button onClick={() => router.push('/jobs')} className='w-full'>
                Browse More Jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default JobInterview;
