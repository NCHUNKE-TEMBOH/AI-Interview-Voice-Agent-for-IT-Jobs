"use client"
import React, { useContext, useEffect, useState } from 'react'
import InterviewHeader from '../_components/InterviewHeader'
import Image from 'next/image'
import { Clock, Info, Loader2Icon, Video } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/services/supabaseClient'
import { toast } from 'sonner'
import { InterviewDataContext } from '@/context/InterviewDataContext'

function Interview() {

    const { interview_id } = useParams();
    console.log(interview_id)
    const [interviewData, setInterviewData] = useState();
    const [userName, setUserName] = useState();
    const [userEmail, setUserEmail] = useState();
    const [loading, setLoading] = useState(false);
    const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext);
    const router = useRouter();

    useEffect(() => {
        interview_id && GetInterviewDetails();
    }, [interview_id])

    const GetInterviewDetails = async () => {
        setLoading(true);
        try {
            let { data: Interviews, error } = await supabase
                .from('Interviews')
                .select("jobposition,jobdescription,duration,type,questionlist")
                .eq('interview_id', interview_id)

            if (error) {
                console.error('Error fetching interview details:', error);
                toast('Error loading interview details');
                setLoading(false);
                return;
            }

            if (Interviews?.length == 0) {
                toast('Incorrect Interview Link');
                setLoading(false);
                return;
            }

            // Map database column names to expected format
            const interviewData = Interviews[0];
            const mappedData = {
                jobPosition: interviewData.jobposition,
                jobDescription: interviewData.jobdescription,
                duration: interviewData.duration,
                type: interviewData.type,
                questionList: interviewData.questionlist
            };

            setInterviewData(mappedData);
            setLoading(false);
        }
        catch (e) {
            console.error('Exception fetching interview details:', e);
            setLoading(false);
            toast('Incorrect Interview Link')
        }
    }

    const onJoinInterview = async () => {
        setLoading(true);
        try {
            let { data: Interviews, error } = await supabase
                .from('Interviews')
                .select('*')
                .eq('interview_id', interview_id);

            if (error) {
                console.error('Error fetching full interview data:', error);
                toast('Error joining interview');
                setLoading(false);
                return;
            }

            if (!Interviews || Interviews.length === 0) {
                toast('Interview not found');
                setLoading(false);
                return;
            }

            const rawData = Interviews[0];
            console.log('Raw interview data:', rawData);

            // Map database column names to expected format
            const mappedInterviewData = {
                jobPosition: rawData.jobposition,
                jobDescription: rawData.jobdescription,
                duration: rawData.duration,
                type: rawData.type,
                questionList: rawData.questionlist ? JSON.parse(rawData.questionlist) : [],
                userEmail: rawData.useremail,
                userName: rawData.username
            };

            console.log('Mapped interview data:', mappedInterviewData);

            setInterviewInfo({
                userName: userName,
                userEmail: userEmail,
                interviewData: mappedInterviewData
            });

            router.push('/interview/' + interview_id + '/start');
        } catch (e) {
            console.error('Exception joining interview:', e);
            toast('Error joining interview');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='px-10 md:px-28 lg:px-48 xl:px-80 mt-7  pb-20'>
            <div className='flex flex-col items-center
             justify-center border rounded-lg bg-white
             p-7 lg:px-33 xl:px-52  mb-20 pb-15'>
                <Image src={'/logo2.png'} alt='logo' width={200} height={100}
                    className='w-[140px]'
                />
                <h2 className='mt-3'>AI-Powered Interview Platform</h2>

                <Image src={'/interview.png'} alt='interview'
                    width={500}
                    height={500}
                    className='w-[280px] my-6'
                />

                <h2 className='font-bold text-xl '>{interviewData?.jobPosition}</h2>
                <h2 className='flex gap-2 items-center text-gray-500 mt-3'>
                    <Clock className='h-4 w-4' /> {interviewData?.duration}</h2>

                <div className='w-full'>
                    <h2>Enter your full name</h2>
                    <Input placeholder='e.g. Jhon Smith' onChange={(event) => setUserName(event.target.value)} />
                </div>
                <div className='w-full mt-4'>
                    <h2>Enter your Email</h2>
                    <Input placeholder='e.g. jhon@gmail.com' onChange={(event) => setUserEmail(event.target.value)} />
                </div>

                <div className='p-3 bg-blue-100 flex gap-4 rounded-lg mt-6'>
                    <Info className='text-primary' />
                    <div>
                        <h2 className='font-bold'>Before you begin</h2>
                        <ul className=''>
                            <li className='text-sm text-primary'>- Test your camera and micrphone</li>
                            <li className='text-sm text-primary'>- Ensure you have a stable internet connection</li>
                            <li className='text-sm text-primary'>- Find a Quiet place for interview</li>

                        </ul>
                    </div>
                </div>

                <Button className={'mt-5 w-full font-bold'}
                    disabled={loading || !userName}
                    onClick={() => onJoinInterview()}
                >
                    <Video /> {loading && <Loader2Icon className='animate-spin' />} Join Interview</Button>
            </div>
        </div>
    )
}

export default Interview