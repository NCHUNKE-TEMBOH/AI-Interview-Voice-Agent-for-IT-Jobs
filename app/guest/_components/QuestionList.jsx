"use client"
import { Button } from '@/components/ui/button'
import { supabase } from '@/services/supabaseClient'
import { Loader2, Loader2Icon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import QuestionListContainer from './QuestionListContainer'
import axios from 'axios'

function QuestionList({ formData, onCreateLink }) {
    const [questionList, setQuestionList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        formData && GenerateQuestionList();
    }, [formData])

    const GenerateQuestionList = async () => {
        setLoading(true);
        try {
            const result = await axios.post('/api/ai-model', {
                ...formData
            })
            console.log(result.data.content);
            const Content = result.data.content;
            const FINAL_CONTENT = Content.replace('```json', '').replace('```', '')
            console.log(JSON.parse(FINAL_CONTENT)?.interviewQuestions)
            setQuestionList(JSON.parse(FINAL_CONTENT)?.interviewQuestions);
            setLoading(false);
        }
        catch (e) {
            console.log(e);
            toast('Server Error, Try Again!')
            setLoading(false);
        }
    }

    const onFinish = async () => {
        setSaveLoading(true);
        const interview_id = uuidv4();

        try {
            // Extract numeric duration from string like "15 Min" -> 15
            const extractDuration = (durationStr) => {
                if (!durationStr) return 15;
                const match = durationStr.match(/(\d+)/);
                return match ? parseInt(match[1]) : 15;
            };

            // Create interview data using the EXACT column names from your table
            const interviewData = {
                interview_id: interview_id,
                useremail: 'guest@practice.com',
                username: 'Guest User',
                jobposition: formData?.jobPosition || 'Practice Interview',
                jobdescription: formData?.jobDescription || 'Practice interview session',
                type: Array.isArray(formData?.type) ? formData.type.join(', ') : (formData?.type || 'Practice'),
                duration: extractDuration(formData?.duration),
                experiencelevel: 'Mid-Level',
                requiredskills: '',
                companycriteria: '',
                questionlist: JSON.stringify(questionList),
                companyid: null,
                jobid: null,
                is_guest: true,
                status: 'active'
            };

            console.log('Creating guest interview with correct column names:', interviewData);

            const { data, error } = await supabase
                .from('Interviews')
                .insert([interviewData])
                .select()

            if (error) {
                console.error('Error creating guest interview:', error);
                console.error('Full error details:', JSON.stringify(error, null, 2));
                toast.error('Failed to create interview: ' + error.message);
                setSaveLoading(false);
                return;
            }

            console.log('Guest interview created successfully:', data);
            toast.success('Interview created successfully!');
            setSaveLoading(false);
            onCreateLink(interview_id);

        } catch (error) {
            console.error('Exception creating guest interview:', error);
            console.error('Full exception details:', JSON.stringify(error, null, 2));
            toast.error('Failed to create interview: ' + (error.message || 'Unknown error'));
            setSaveLoading(false);
        }
    }

    return (
        <div>
            {loading &&
                <div className='p-5 bg-blue-50 rounded-xl border border-primary flex gap-5 items-center'>
                    <Loader2Icon className='animate-spin' />
                    <div>
                        <h2 className='font-medium'>Generating Interview Questions</h2>
                        <p className='text-primary'>Our AI is crafting personalized questions based on your job position</p>
                    </div>
                </div>
            }
            {questionList?.length > 0 &&
                <div>
                    <QuestionListContainer questionList={questionList} />
                </div>
            }

            <div className='flex justify-end mt-10'>
                <Button onClick={() => onFinish()} disabled={saveLoading}>
                    {saveLoading && <Loader2 className='animate-spin' />}
                    Create Interview Link
                </Button>
            </div>
        </div>
    )
}

export default QuestionList
