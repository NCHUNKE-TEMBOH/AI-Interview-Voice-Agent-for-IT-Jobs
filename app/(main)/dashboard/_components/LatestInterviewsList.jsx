"use client"
import { useUser } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/services/supabaseClient';
import { Camera, Video } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import InterviewCard from './InterviewCard';
import { toast } from 'sonner';
import Link from 'next/link';

function LatestInterviewsList() {
    const [interviewList, setInterviewList] = useState([]);
    const { user } = useUser();

    useEffect(() => {
        user && GetInterviewList();
    }, [user])

    const GetInterviewList = async () => {
        try {
            let { data: Interviews, error } = await supabase
                .from('Interviews')
                .select('*')
                .eq('userEmail', user?.email)
                .order('id', { ascending: false })
                .limit(6);

            if (error) {
                console.error("Error fetching interviews:", error);
                // Set to empty array instead of null to prevent UI issues
                setInterviewList([]);
                return;
            }

            console.log("Fetched interviews:", Interviews);
            setInterviewList(Interviews || []);
        } catch (error) {
            console.error("Exception fetching interviews:", error);
            setInterviewList([]);
        }
    }



    return (
        <div className='my-5'>
            <h2 className='font-bold text-2xl'>Previously Created Interviews</h2>

            {/* Always show the create interview button */}
            <div className='p-5 flex flex-col gap-3 items-center bg-white rounded-xl mt-5'>
                <Video className='h-10 w-10 text-primary' />
                <h2>{interviewList?.length === 0 ? "You don't have any interviews created!" : "Create a new interview"}</h2>
                <Link href={'/dashboard/create-interview'}>
                    <Button>+ Create New Interview</Button>
                </Link>
            </div>

            {/* Show interviews if available */}
            {interviewList && interviewList.length > 0 && (
                <div className='mt-5'>
                    <h3 className='font-bold text-xl mb-3'>Your Recent Interviews</h3>
                    <div className='grid grid-cols-2 xl:grid-cols-3 gap-5'>
                        {interviewList.map((interview, index) => (
                            <InterviewCard interview={interview} key={index} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default LatestInterviewsList