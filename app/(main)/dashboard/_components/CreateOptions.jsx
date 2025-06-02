"use client"
import { BriefcaseBusiness, FileText, User } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function CreateOptions() {
    return (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
            <Link href={'/jobs'} className='bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow'
            >
                <BriefcaseBusiness className='p-3 text-primary bg-blue-50 rounded-lg h-12 w-12' />
                <h2 className='font-bold'>Find Jobs</h2>
                <p className='text-gray-500'>Browse job listings and apply with AI interviews</p>
            </Link>

            <Link href={'/dashboard/profile'} className='bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow'
            >
                <User className='p-3 text-primary bg-blue-50 rounded-lg h-12 w-12' />
                <h2 className='font-bold'>Update Profile</h2>
                <p className='text-gray-500'>Manage your profile and upload your CV</p>
            </Link>

            <Link href={'/dashboard/applications'} className='bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow'
            >
                <FileText className='p-3 text-primary bg-blue-50 rounded-lg h-12 w-12' />
                <h2 className='font-bold'>Application History</h2>
                <p className='text-gray-500'>View your job applications and their status</p>
            </Link>
        </div>
    )
}

export default CreateOptions