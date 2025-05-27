"use client"
import { useUser } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/services/supabaseClient';
import { Video } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import InterviewCard from '../dashboard/_components/InterviewCard';

function AllInterview() {
    const [interviewList, setInterviewList] = useState([]);
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        user && GetInterviewList();
    }, [user])

    const GetInterviewList = async () => {
        try {
            setLoading(true);
            let { data: Interviews, error } = await supabase
                .from('Interviews')
                .select('*')
                .eq('userEmail', user?.email)
                .order('id', { ascending: false });

            if (error) {
                console.error("Error fetching all interviews:", error);
                setInterviewList([]);
                return;
            }

            console.log("Fetched all interviews:", Interviews);
            setInterviewList(Interviews || []);
        } catch (error) {
            console.error("Exception fetching all interviews:", error);
            setInterviewList([]);
        } finally {
            setLoading(false);
        }
    }



    return (
        <div className='my-5'>
            <h2 className='font-bold text-2xl'>All Previously Created Interviews</h2>

            {/* Show loading state */}
            {loading && (
                <div className='p-5 flex flex-col gap-3 items-center bg-white rounded-xl mt-5'>
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    <h2>Loading your interviews...</h2>
                </div>
            )}

            {/* Show empty state or create button */}
            {!loading && (
                <div className='p-5 flex flex-col gap-3 items-center bg-white rounded-xl mt-5'>
                    <Video className='h-10 w-10 text-primary' />
                    <h2>{interviewList?.length === 0 ? "You don't have any interviews created!" : "Create a new interview"}</h2>
                    <Button onClick={() => window.location.href = '/dashboard/create-interview'}>
                        + Create New Interview
                    </Button>
                </div>
            )}

            {/* Show interviews if available */}
            {!loading && interviewList && interviewList.length > 0 && (
                <div className='mt-5'>
                    <h3 className='font-bold text-xl mb-3'>Your Interview History</h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'>
                        {interviewList.map((interview, index) => (
                            <InterviewCard interview={interview} key={index} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default AllInterview