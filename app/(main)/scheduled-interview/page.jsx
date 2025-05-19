"use client"
import { useUser } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/services/supabaseClient'
import { Video } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import InterviewCard from '../dashboard/_components/InterviewCard';

function ScheduledInterview() {
    const { user } = useUser();
    const [interviewList, setInterviewList] = useState([]);
    useEffect(() => {
        user && GetInterviewList();
    }, [user])

    const GetInterviewList = async () => {
        try {
            const result = await supabase.from('Interviews')
                .select('jobPosition,duration,interview_id,interview-feedback(userEmail)')
                .eq('userEmail', user?.email)
                .order('id', { ascending: false });

            if (result.error) {
                console.error("Error fetching scheduled interviews:", result.error);
                setInterviewList([]);
                return;
            }

            console.log("Fetched scheduled interviews:", result);
            setInterviewList(result.data || []);
        } catch (error) {
            console.error("Exception fetching scheduled interviews:", error);
            setInterviewList([]);
        }
    }

    return (
        <div className='mt-5'>
            <h2 className='font-bold text-2xl'>Interview List with Candidate Feedback</h2>

            {/* Always show a message */}
            <div className='p-5 flex flex-col gap-3 items-center bg-white rounded-xl mt-5'>
                <Video className='h-10 w-10 text-primary' />
                <h2>{interviewList?.length === 0 ? "You don't have any interviews scheduled!" : "Schedule more interviews"}</h2>
                <Button onClick={() => window.location.href = '/dashboard/create-interview'}>
                    + Create New Interview
                </Button>
            </div>

            {/* Show interviews if available */}
            {interviewList && interviewList.length > 0 && (
                <div className='mt-5'>
                    <h3 className='font-bold text-xl mb-3'>Your Scheduled Interviews</h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'>
                        {interviewList.map((interview, index) => (
                            <InterviewCard
                                interview={interview}
                                key={index}
                                viewDetail={true}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ScheduledInterview