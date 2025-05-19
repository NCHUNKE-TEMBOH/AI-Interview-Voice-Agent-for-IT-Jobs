"use client"
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/services/supabaseClient';
import { ArrowLeft, CheckCircle, Info, Loader2Icon, Mic, Phone, Timer, X } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Vapi from "@vapi-ai/web";
// Using inline components instead of importing from external files
// import AlertConfirmation from '@/app/interview/_components/AlertConfirmation';
// import TimerComponent from '@/app/interview/[interview_id]/start/_components/TimerComponent';
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
  const [seconds, setSeconds] = useState(0);

  // Timer functionality
  useEffect(() => {
    let interval;
    if (step === 2 && !callEnd) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, callEnd]);

  // Format seconds into MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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

      // Get interview details to retrieve pre-generated questions
      const { data: interviewData, error: interviewError } = await supabase
        .from('Interviews')
        .select('*')
        .eq('jobid', id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (interviewError) {
        console.error("Error fetching interview data:", interviewError);
      } else if (interviewData && interviewData.length > 0) {
        // Merge the interview data with the job data
        jobData.questionlist = interviewData[0].questionlist;
        console.log("Found pre-generated questions:", jobData.questionlist);
      }

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
    try {
      // Format the interview types for the AI
      const interviewTypes = job.interview_type ? job.interview_type.split(',').map(type => type.trim()).join(', ') : 'General';

      // Get pre-generated questions from the database
      let interviewQuestions = [];
      try {
        if (job.questionlist) {
          interviewQuestions = JSON.parse(job.questionlist);
          console.log("Using pre-generated questions from database:", interviewQuestions);
        }
      } catch (error) {
        console.error("Error parsing questionlist from database:", error);
      }

      // Fallback to default questions if none were found
      if (!interviewQuestions || interviewQuestions.length === 0) {
        interviewQuestions = [
          "Tell me about your experience related to this role.",
          "What skills do you have that make you a good fit for this position?",
          "How do you handle challenging situations in the workplace?",
          "Why are you interested in this position?",
          "What are your strengths and weaknesses?",
          "Describe a project you worked on that you're proud of.",
          "How do you stay updated with industry trends?",
          "Where do you see yourself in 5 years?",
          "How do you handle feedback?",
          "Do you have any questions for us?"
        ];
        console.log("Using default questions:", interviewQuestions);
      }

      // Format questions for the AI prompt
      const formattedQuestions = interviewQuestions.map((q, i) => `Question ${i+1}: ${q}`).join('\n\n');

      console.log("Starting Vapi call with API key:", process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

      const assistantOptions = {
        name: "AI Interviewer",
        firstMessage: `Hi ${userName}, welcome to your interview for the ${job.job_title} position at ${company?.name || 'our company'}. I'll be asking you some questions to assess your fit for this role. Are you ready to begin?`,
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
You are an AI voice assistant conducting interviews for a ${job.job_title} position at ${company?.name || 'our company'}.

Job Description: ${job.job_description || 'A professional role requiring strong communication and technical skills.'}

Required Skills: ${job.required_skills || 'Communication, problem-solving, teamwork, and technical expertise.'}

Experience Level: ${job.experience_level || 'Mid-Level'}

Interview Types: ${interviewTypes}

Company Criteria: ${job.ai_criteria || 'Looking for candidates who demonstrate strong problem-solving abilities, good communication skills, and relevant experience.'}

Your job is to ask candidates interview questions from the list below, assess their responses based on the company's criteria.

Begin the conversation with a friendly introduction, setting a relaxed yet professional tone.

Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise.

Here are the specific questions you MUST ask in this order:

${formattedQuestions}

If the candidate struggles, offer hints or rephrase the question without giving away the answer.

At the end of the interview, thank the candidate and let them know that their results will be sent to the company for review.

✅ Ensure the interview remains focused on the job requirements and company criteria.
`.trim(),
            },
          ],
        },
      };

      // Start the Vapi call
      vapi.start(assistantOptions);
      setCallEnd(false);

      // Set up event listeners
      vapi.on("call-start", () => {
        console.log("Call has started.");
        toast.success('Call Connected...');
      });

      vapi.on("speech-start", () => {
        console.log("Assistant speech has started.");
        setActiveUser(false);
      });

      vapi.on("speech-end", () => {
        console.log("Assistant speech has ended.");
        setActiveUser(true);
      });

      vapi.on("call-end", (event) => {
        console.log("Call has ended:", event);
        toast('Interview Ended... Please Wait...');
        setCallEnd(true);

        // Create a default conversation if none exists
        if (!conversation) {
          const defaultConversation = {
            messages: [
              {
                role: "assistant",
                content: "Thank you for participating in this interview. We'll analyze your responses and get back to you soon."
              },
              {
                role: "user",
                content: "Thank you for the opportunity."
              }
            ]
          };
          setConversation(JSON.stringify(defaultConversation));
        }

        generateFeedback();
      });

      vapi.on("error", (error) => {
        console.error("Vapi error:", error);
        toast.error(`Interview error: ${error.message || 'Unknown error'}`);
        setCallEnd(true);

        // Create a default conversation if none exists
        if (!conversation) {
          const defaultConversation = {
            messages: [
              {
                role: "assistant",
                content: "There was an error during the interview, but we'll still process your application."
              },
              {
                role: "user",
                content: "I understand, thank you."
              }
            ]
          };
          setConversation(JSON.stringify(defaultConversation));
        }

        generateFeedback();
      });

      vapi.on("message", (message) => {
        console.log("Received message:", message);
        if (message?.conversation) {
          console.log("Conversation:", message.conversation);
          setConversation(JSON.stringify(message.conversation));
        }
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      toast.error(`Failed to start interview: ${error.message || 'Unknown error'}`);
      setCallEnd(true);
    }
  };

  const stopInterview = () => {
    vapi.stop();
    console.log("STOP...");
    setCallEnd(true);
    generateFeedback();
  };

  const generateFeedback = async () => {
    setProcessingFeedback(true);

    try {
      if (!conversation) {
        console.warn('No conversation data available, using default conversation');
        // Create a default conversation if none exists
        const defaultConversation = JSON.stringify({
          messages: [
            {
              role: "assistant",
              content: "Thank you for participating in this interview. We'll analyze your responses and get back to you soon."
            },
            {
              role: "user",
              content: "Thank you for the opportunity."
            }
          ]
        });
        setConversation(defaultConversation);
      }

      console.log("Generating feedback for conversation:", conversation);

      // Send conversation to AI for feedback
      const result = await axios.post('/api/ai-feedback', {
        conversation: conversation,
        jobTitle: job?.job_title || 'Job Position',
        jobDescription: job?.job_description || 'A professional role requiring strong skills.',
        requiredSkills: job?.required_skills || 'Communication, problem-solving, teamwork',
        companyCriteria: job?.ai_criteria || 'Looking for qualified candidates'
      });

      console.log("AI feedback result:", result.data);

      let feedbackData;
      try {
        const Content = result.data.content || '{}';
        const FINAL_CONTENT = Content.replace('```json', '').replace('```', '');
        feedbackData = JSON.parse(FINAL_CONTENT);
      } catch (parseError) {
        console.error("Error parsing feedback JSON:", parseError);
        // Create default feedback if parsing fails
        feedbackData = {
          feedback: {
            strengths: ["Communication skills", "Professional attitude"],
            areas_for_improvement: ["More specific examples needed"],
            overall_assessment: "Candidate showed potential for the role.",
            matchScore: 70
          }
        };
      }

      console.log("Processed feedback data:", feedbackData);

      // Save feedback to database
      const { error } = await supabase
        .from('Job_Submissions')
        .insert([
          {
            job_id: job?.id,
            user_name: userName || 'Candidate',
            user_email: userEmail || 'candidate@example.com',
            feedback: feedbackData,
            status: 'pending',
            score: feedbackData.feedback?.matchScore || 70
          },
        ]);

      if (error) {
        console.error("Error saving feedback to database:", error);
        toast.warning("Interview completed, but there was an issue saving your feedback.");
      } else {
        console.log("Feedback saved successfully");
        toast.success("Interview completed and feedback saved!");
      }

      // Move to completion step
      setStep(3);
    } catch (error) {
      console.error('Error generating feedback:', error);
      toast.error('Failed to process interview feedback. We will still consider your application.');

      // Still move to completion step even if there's an error
      setStep(3);
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
              {/* Inline Timer Component */}
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border">
                <Timer className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{formatTime(seconds)}</span>
              </div>

              {/* Inline End Interview Button */}
              <Button variant="destructive" size="sm" onClick={stopInterview}>
                <X className="h-4 w-4 mr-1" />
                End Interview
              </Button>
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
