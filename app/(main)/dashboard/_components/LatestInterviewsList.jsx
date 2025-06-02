"use client"
import { useUser } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/services/supabaseClient';
import { Camera, Video, FileText } from 'lucide-react';
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
            <h2 className='font-bold text-2xl'>Quick Actions</h2>

            {/* Show application-focused actions */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5 mt-5'>
                <Link href={'/dashboard/applications'} className='bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow'>
                    <FileText className='p-3 text-primary bg-blue-50 rounded-lg h-12 w-12' />
                    <h2 className='font-bold'>My Applications</h2>
                    <p className='text-gray-500'>Track your job applications and interview status</p>
                </Link>

                <Link href={'/billing'} className='bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow'>
                    <Camera className='p-3 text-primary bg-blue-50 rounded-lg h-12 w-12' />
                    <h2 className='font-bold'>Manage Credits</h2>
                    <p className='text-gray-500'>View your credits and purchase more for job applications</p>
                </Link>
            </div>
        </div>
    )
}

export default LatestInterviewsList