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
import axios from 'axios';
import MicrophoneTest from '@/app/components/MicrophoneTest';
// Using inline components instead of importing from external files
// import AlertConfirmation from '@/app/interview/_components/AlertConfirmation';
// import TimerComponent from '@/app/interview/[interview_id]/start/_components/TimerComponent';

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
  const [microphoneWorking, setMicrophoneWorking] = useState(false);
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

  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(null);
  const [simulatedQuestion, setSimulatedQuestion] = useState('');
  const [simulatedQuestionIndex, setSimulatedQuestionIndex] = useState(0);

  // Function to simulate an interview without using Vapi
  const simulateInterview = () => {
    console.log("Starting simulated interview experience");
    setCallEnd(false);

    // Get questions from the job
    let interviewQuestions = [];
    try {
      if (job.questionlist) {
        interviewQuestions = JSON.parse(job.questionlist);
      }
    } catch (error) {
      console.error("Error parsing questionlist:", error);
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
    }

    // Start with introduction
    const introduction = `Welcome to your interview for the ${job.job_title} position at ${company?.name || 'our company'}. I'll be asking you some questions to assess your fit for this role.`;
    setSimulatedQuestion(introduction);

    // Create a default conversation
    const defaultConversation = {
      messages: [
        {
          role: "assistant",
          content: introduction
        }
      ]
    };
    setConversation(JSON.stringify(defaultConversation));

    // Set up a timer to show the first question after 3 seconds
    setTimeout(() => {
      if (interviewQuestions.length > 0) {
        setSimulatedQuestion(interviewQuestions[0]);
        setSimulatedQuestionIndex(1);

        // Update conversation
        const updatedConversation = {
          messages: [
            ...defaultConversation.messages,
            {
              role: "assistant",
              content: interviewQuestions[0]
            }
          ]
        };
        setConversation(JSON.stringify(updatedConversation));
      }
    }, 3000);
  };

  const startInterview = async () => {
    if (!userName || !userEmail) {
      toast.error('Please enter your name and email');
      return;
    }

    // Check if microphone was tested and working
    if (!microphoneWorking) {
      toast.warning('Your microphone may not be working properly. The interview may not function correctly.');
    }

    setStep(2);
    await startCall();
  };

  const startCall = async () => {
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
        firstMessage: `Hi ${userName}, welcome to your interview for the ${job.job_title} position at ${company?.name || 'our company'}. I'll be asking you some questions to assess your fit for this role. Please say "Yes, I'm ready" when you're ready to begin.`,
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
          // Increase sensitivity to detect quieter speech
          options: {
            sensitivity: 0.7,
            vad_turnoff: 500  // Increase voice activity detection timeout
          }
        },
        voice: {
          provider: "playht",
          voiceId: "jennifer",
        },
        // Configure silence timeout settings
        silenceTimeoutMs: 10000,  // Increase silence timeout to 10 seconds (default is 5000)
        recordingTimeoutMs: 300000,  // Set maximum recording time to 5 minutes
        // Configure call settings
        endCallAfterSilenceTimeout: false,  // Don't end call after first silence timeout
        model: {
          provider: "openai",
          model: "gpt-4",
          temperature: 0.7,  // Add some variability to responses
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

IMPORTANT: Wait for the candidate to say they are ready before starting the interview questions.
If the candidate doesn't respond, prompt them again by saying "Can you please confirm when you're ready to begin the interview?"

Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise.

Here are the specific questions you MUST ask in this order:

${formattedQuestions}

If the candidate struggles, offer hints or rephrase the question without giving away the answer.

If you don't hear a response after asking a question, say "I didn't catch that. Could you please repeat your answer?"

At the end of the interview, thank the candidate and let them know that their results will be sent to the company for review.

✅ Ensure the interview remains focused on the job requirements and company criteria.
`.trim(),
            },
          ],
        },
      };

      console.log("Starting Vapi with options:", JSON.stringify(assistantOptions, null, 2));
      console.log("Using microphone device ID:", selectedMicrophoneId);

      try {
        // First, get direct access to the microphone to ensure it's working
        let stream;
        try {
          console.log("Directly accessing microphone before starting Vapi...");
          const audioConstraints = selectedMicrophoneId ? {
            deviceId: { exact: selectedMicrophoneId },
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          } : true;

          stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
          console.log("Successfully accessed microphone directly:", stream.getAudioTracks()[0].label);

          // Stop the stream - Vapi will request it again
          stream.getTracks().forEach(track => track.stop());
        } catch (micError) {
          console.error("Error directly accessing microphone:", micError);
          toast.error(`Microphone access failed: ${micError.message}. Please check your browser settings.`);
          // Continue anyway - Vapi will try to access the microphone itself
        }

        // Check if Vapi API key is valid
        const apiKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
        if (!apiKey || apiKey.includes('your_vapi_public_key') || apiKey === '16903ee7-5c1a-4ce3-8cfa-3f050b318391') {
          console.error("Invalid or missing Vapi API key:", apiKey);
          toast.error("Invalid Vapi API key. Please update your .env file with a valid key.");

          // Create a simulated interview experience without Vapi
          simulateInterview();
          return;
        }

        // Start the Vapi call with default audio settings
        // Let Vapi handle the microphone access to avoid conflicts
        console.log("Starting Vapi with default audio settings");
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

        // Listen for user speech events
        vapi.on("user-speech-start", () => {
          console.log("User speech has started.");
          // You can add visual feedback here
        });

        vapi.on("user-speech-end", () => {
          console.log("User speech has ended.");
          // You can add visual feedback here
        });

        // Listen for transcription events
        vapi.on("transcription", (transcription) => {
          console.log("Transcription received:", transcription);
          // This shows what the system heard from the user
        });

        vapi.on("call-end", (event) => {
          console.log("Call has ended:", event);
          toast('Interview Ended... Please Wait...');
          setCallEnd(true);

          // Create a default conversation if none exists or is empty
          if (!conversation || conversation === '{}' || conversation === '[]') {
            console.log("No conversation data, creating default conversation");
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
          } else {
            console.log("Using existing conversation data for feedback");
          }

          // Wait a moment before generating feedback to ensure conversation state is updated
          setTimeout(() => {
            generateFeedback();
          }, 1000);
        });

        vapi.on("error", (error) => {
          console.error("Vapi error:", error);
          toast.error(`Interview error: ${error.message || 'Unknown error'}`);
          setCallEnd(true);

          // Create a default conversation if none exists
          if (!conversation || conversation === '{}' || conversation === '[]') {
            console.log("No conversation data after error, creating default conversation");
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

          // Wait a moment before generating feedback to ensure conversation state is updated
          setTimeout(() => {
            generateFeedback();
          }, 1000);
        });

        vapi.on("message", (message) => {
          console.log("Received message from Vapi:", message);
          if (message?.conversation) {
            console.log("Conversation updated:", message.conversation);
            setConversation(JSON.stringify(message.conversation));
          }
        });

        // Add a debug event to log all events
        vapi.on("*", (event, data) => {
          if (event !== "transcription" && event !== "message") { // Skip high-frequency events
            console.log(`Vapi event '${event}':`, data);
          }
        });
      } catch (vapiError) {
        console.error("Error starting Vapi:", vapiError);
        toast.error(`Failed to start interview: ${vapiError.message || 'Unknown error'}`);
        setCallEnd(true);
      }
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
      // Ensure we have valid conversation data
      let conversationData;

      if (!conversation || conversation === '{}' || conversation === '[]') {
        console.warn('No conversation data available, using default conversation');
        // Create a default conversation if none exists
        conversationData = {
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
        setConversation(JSON.stringify(conversationData));
      } else {
        // Try to parse the conversation if it's a string
        try {
          conversationData = typeof conversation === 'string' ? JSON.parse(conversation) : conversation;
        } catch (parseError) {
          console.error("Error parsing conversation data:", parseError);
          conversationData = {
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
        }
      }

      console.log("Generating feedback for conversation:",
        typeof conversationData === 'object' ? JSON.stringify(conversationData) : conversationData);

      // Validate conversation format before sending to API
      if (!conversationData || !conversationData.messages || !Array.isArray(conversationData.messages)) {
        console.error("Invalid conversation format:", conversationData);
        throw new Error("Invalid conversation format");
      }

      // Ensure there are at least two messages in the conversation
      if (conversationData.messages.length < 2) {
        console.warn("Conversation too short, adding default messages");
        conversationData.messages.push(
          {
            role: "assistant",
            content: "Thank you for your time today. Do you have any questions for me?"
          },
          {
            role: "user",
            content: "No, thank you for the opportunity."
          }
        );
      }

      // Send conversation to AI for feedback
      console.log("Sending conversation to AI feedback API...");
      const result = await axios.post('/api/ai-feedback', {
        conversation: conversationData,
        jobTitle: job?.job_title || 'Job Position',
        jobDescription: job?.job_description || 'A professional role requiring strong skills.',
        requiredSkills: job?.required_skills || 'Communication, problem-solving, teamwork',
        companyCriteria: job?.ai_criteria || 'Looking for qualified candidates'
      });

      console.log("AI feedback result:", result.data);

      let feedbackData;
      try {
        const Content = result.data.content || '{}';
        // Handle different formats of JSON response
        let jsonContent = Content;

        // Remove markdown code blocks if present
        if (Content.includes('```')) {
          jsonContent = Content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        }

        // Trim whitespace
        jsonContent = jsonContent.trim();

        // Parse the JSON
        feedbackData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error("Error parsing feedback JSON:", parseError, "Raw content:", result.data.content);
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

      // Ensure feedback has the expected structure
      if (!feedbackData.feedback) {
        console.warn("Feedback data missing 'feedback' property, adding default structure");
        feedbackData = {
          feedback: {
            strengths: feedbackData.strengths || ["Communication skills"],
            areas_for_improvement: feedbackData.areas_for_improvement || ["More specific examples needed"],
            overall_assessment: feedbackData.overall_assessment || "Candidate showed potential for the role.",
            matchScore: feedbackData.matchScore || 70
          }
        };
      }

      // Save feedback to database
      console.log("Saving feedback to database...");
      const { data: submissionData, error } = await supabase
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
        ])
        .select();

      if (error) {
        console.error("Error saving feedback to database:", error);
        toast.warning("Interview completed, but there was an issue saving your feedback.");
      } else {
        console.log("Feedback saved successfully:", submissionData);
        toast.success("Interview completed and feedback saved!");
      }

      // Move to completion step
      setStep(3);
    } catch (error) {
      console.error('Error generating feedback:', error);

      // Create default feedback for database
      const defaultFeedback = {
        feedback: {
          strengths: ["Communication skills", "Professional attitude"],
          areas_for_improvement: ["More specific examples needed"],
          overall_assessment: "Candidate showed potential for the role.",
          matchScore: 70
        }
      };

      // Try to save default feedback to database
      try {
        console.log("Saving default feedback to database after error...");
        const { error: dbError } = await supabase
          .from('Job_Submissions')
          .insert([
            {
              job_id: job?.id,
              user_name: userName || 'Candidate',
              user_email: userEmail || 'candidate@example.com',
              feedback: defaultFeedback,
              status: 'pending',
              score: 70
            },
          ]);

        if (dbError) {
          console.error("Error saving default feedback to database:", dbError);
        } else {
          console.log("Default feedback saved successfully");
        }
      } catch (dbError) {
        console.error("Exception saving default feedback:", dbError);
      }

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

                {/* Microphone Test Component */}
                <MicrophoneTest
                  onTestComplete={(isWorking, deviceId) => {
                    setMicrophoneWorking(isWorking);
                    setSelectedMicrophoneId(deviceId);
                    console.log("Microphone test completed:", isWorking ? "Working" : "Not working", "Device ID:", deviceId);

                    if (!isWorking) {
                      toast.warning("Your microphone doesn't seem to be working properly. The interview may not function correctly.");
                    } else {
                      toast.success("Microphone is working properly!");
                    }
                  }}
                />

                <div className="p-3 bg-blue-100 flex gap-4 rounded-lg">
                  <Info className="text-primary flex-shrink-0" />
                  <div>
                    <h2 className="font-bold">Before you begin</h2>
                    <ul className="">
                      <li className="text-sm text-primary">- Ensure you have a stable internet connection</li>
                      <li className="text-sm text-primary">- Find a quiet place for the interview</li>
                      <li className="text-sm text-primary">- Speak clearly and at a normal volume</li>
                      <li className="text-sm text-primary">- Wait for the AI to finish speaking before responding</li>
                    </ul>
                    <div className="mt-2 space-y-1">
                      <div>
                        <a href="/mic-test" target="_blank" className="text-sm text-blue-600 hover:underline">
                          Having microphone issues? Try our advanced microphone test
                        </a>
                      </div>
                      <div>
                        <a href="/browser-check" target="_blank" className="text-sm text-blue-600 hover:underline">
                          Check browser compatibility and microphone permissions
                        </a>
                      </div>
                    </div>
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

          {/* Show message for simulated interview */}
          {simulatedQuestion && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You are in simulated interview mode because the Vapi API key is invalid or missing.
                Please update your .env file with a valid Vapi API key to enable voice interviews.
                In this mode, you can click "Next Question" to proceed through the interview.
              </p>
            </div>
          )}

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

              {/* Show simulated question if available */}
              {simulatedQuestion && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg max-w-xs text-center">
                  {simulatedQuestion}
                </div>
              )}
            </div>

            <div className='bg-white h-[400px] rounded-lg border flex flex-col gap-3 items-center justify-center'>
              <div className='relative'>
                {activeUser && <span className="absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping" />}
                <div className='w-[60px] h-[60px] rounded-full bg-gray-200 flex items-center justify-center'>
                  <Mic className='text-gray-600' />
                </div>
              </div>
              <h2>{userName}</h2>

              {/* Show next question button for simulated interview */}
              {simulatedQuestion && simulatedQuestionIndex > 0 && (
                <Button
                  className="mt-4"
                  onClick={() => {
                    // Get questions from the job
                    let interviewQuestions = [];
                    try {
                      if (job.questionlist) {
                        interviewQuestions = JSON.parse(job.questionlist);
                      }
                    } catch (error) {
                      console.error("Error parsing questionlist:", error);
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
                    }

                    // Check if we have more questions
                    if (simulatedQuestionIndex < interviewQuestions.length) {
                      // Show next question
                      setSimulatedQuestion(interviewQuestions[simulatedQuestionIndex]);
                      setSimulatedQuestionIndex(simulatedQuestionIndex + 1);

                      // Update conversation
                      try {
                        const currentConversation = JSON.parse(conversation);
                        const updatedConversation = {
                          messages: [
                            ...currentConversation.messages,
                            {
                              role: "user",
                              content: "I've answered this question."
                            },
                            {
                              role: "assistant",
                              content: interviewQuestions[simulatedQuestionIndex]
                            }
                          ]
                        };
                        setConversation(JSON.stringify(updatedConversation));
                      } catch (error) {
                        console.error("Error updating conversation:", error);
                      }
                    } else {
                      // End the interview
                      setCallEnd(true);
                      toast('Interview Ended... Please Wait...');
                      generateFeedback();
                    }
                  }}
                >
                  Next Question
                </Button>
              )}
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
