import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Calendar, Clock, Copy, List, Mail, Plus, LogIn, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { toast } from 'sonner'

function InterviewLink({ interview_id, formData }) {
    const [copied, setCopied] = useState(false);

    // Get the current host URL dynamically
    const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000';
    };

    const url = `${getBaseUrl()}/interview/${interview_id}`;

    const GetInterviewUrl = () => {
        return url;
    }

    const onCopyLink = async () => {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                toast.success('Interview link copied to clipboard!');
                setTimeout(() => setCopied(false), 3000);
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                try {
                    document.execCommand('copy');
                    setCopied(true);
                    toast.success('Interview link copied to clipboard!');
                    setTimeout(() => setCopied(false), 3000);
                } catch (err) {
                    console.error('Fallback copy failed:', err);
                    toast.error('Copy failed. Please copy the link manually.');
                }

                document.body.removeChild(textArea);
            }
        } catch (err) {
            console.error('Copy to clipboard failed:', err);
            toast.error('Copy failed. Please copy the link manually.');
        }
    }

    return (
        <div className='flex items-center justify-center flex-col mt-10'>
            <div className=''>
                <Image src={'/check.png'} alt='check'
                    width={200}
                    height={200}
                    className='w-[50px] h-[50px]'
                />
            </div>
            <h2 className='font-bold text-lg mt-4'>Your AI Interview is Ready!</h2>
            <p className='mt-3'>Share this link with candidates to start the interview process</p>

            <div className='w-full p-7 mt-6 rounded-lg bg-white'>
                <div className='flex justify-between items-center'>
                    <h2 className='font-bold'>Interview Link</h2>
                    <h2 className='p-1 px-2 text-primary bg-blue-50 rounded-4xl'>Valid for 30 Days</h2>
                </div>
                <div className='mt-3 flex gap-3 items-center'>
                    <Input defaultValue={GetInterviewUrl()} disabled={true} />
                    <Button
                        onClick={() => onCopyLink()}
                        variant={copied ? "default" : "outline"}
                        className={copied ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                    >
                        {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                </div>
                <hr className='my-5' />
                <div className='flex gap-5 items-center'>
                    <h2 className='text-sm'><Calendar className='h-4 w-4 inline mr-1' />Job Position: </h2>
                    <h2 className='text-sm font-medium'>{formData?.jobPosition}</h2>
                </div>
                <div className='flex gap-5 items-center mt-2'>
                    <h2 className='text-sm'><Clock className='h-4 w-4 inline mr-1' />Duration: </h2>
                    <h2 className='text-sm font-medium'>{formData?.duration}</h2>
                </div>
            </div>

            <div className='mt-7 bg-white p-5 rounded-lg w-full'>
                <h2 className='font-bold'>Share Via</h2>
                <div className='flex gap-7 mt-2 justify-around'>
                    <Button variant={'outline'} className=''> <Mail /> Slack </Button>
                    <Button variant={'outline'} className=''> <Mail /> Email </Button>
                    <Button variant={'outline'} className=''> <Mail /> Whatsapp </Button>

                </div>
            </div>
            <div className='flex w-full gap-5 justify-between mt-6'>
                <Link href={'/guest'}>
                    <Button variant={'outline'} > <ArrowLeft /> Back to Guest Dashboard </Button>
                </Link>
                <Link href={'/guest'}>
                    <Button> <Plus /> Create New Interview </Button>
                </Link>
            </div>

            {/* Encourage account creation */}
            <div className='mt-8 p-5 bg-blue-50 rounded-lg w-full text-center'>
                <h3 className='font-semibold mb-2'>Want to apply for real jobs?</h3>
                <p className='text-sm text-gray-600 mb-4'>
                    Create an account to apply for jobs, track applications, and get hired!
                </p>
                <Link href={'/auth'}>
                    <Button>
                        <LogIn className='mr-2 h-4 w-4' />
                        Create Account
                    </Button>
                </Link>
            </div>
        </div>
    )
}

export default InterviewLink
