"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/provider';

function CompanyPage() {
    const router = useRouter();
    const { company, isCompany } = useUser();

    useEffect(() => {
        // Redirect to dashboard immediately
        router.replace('/company/dashboard');
    }, [router]);

    // Show loading while redirecting
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
}

export default CompanyPage;
