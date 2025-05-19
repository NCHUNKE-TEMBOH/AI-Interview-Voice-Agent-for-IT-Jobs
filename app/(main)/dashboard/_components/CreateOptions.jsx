"use client"
import { BriefcaseBusiness, Phone, Video } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function CreateOptions() {
    return (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
            <Link href={'/dashboard/create-interview'} className='bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow'
            >
                <Video className='p-3 text-primary bg-blue-50 rounded-lg h-12 w-12' />
                <h2 className='font-bold'>Practice Interview</h2>
                <p className='text-gray-500'>Create AI practice interviews to improve your skills</p>
            </Link>

            <Link href={'/jobs'} className='bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow'
            >
                <BriefcaseBusiness className='p-3 text-primary bg-blue-50 rounded-lg h-12 w-12' />
                <h2 className='font-bold'>Find Jobs</h2>
                <p className='text-gray-500'>Browse job listings and apply with AI interviews</p>
            </Link>

            <div className='bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2'>
                <Phone className='p-3 text-primary bg-blue-50 rounded-lg h-12 w-12' />
                <h2 className='font-bold'>Phone Screening</h2>
                <p className='text-gray-500'>Schedule phone screening calls with recruiters</p>
            </div>
        </div>
    )
}

export default CreateOptions