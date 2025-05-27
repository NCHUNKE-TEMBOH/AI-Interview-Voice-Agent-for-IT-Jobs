"use client"
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React, { useEffect, useState } from 'react'
import { AppSidebar } from './_components/AppSidebar'
import WelcomeContainer from './dashboard/_components/WelcomeContainer'
import { useUser } from '../provider'
import { useRouter } from 'next/navigation'
import { supabase } from '@/services/supabaseClient'
import CompanyOnboardingForm from './company/_components/CompanyOnboardingForm'


function DashboardProvider({ children }) {
    const { user, setUser, userType, setUserType, company, setCompany, isCompany } = useUser();
    const router = useRouter();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // This effect runs once on component mount to check authentication
    useEffect(() => {
        const checkAuth = async () => {
            try {
                setIsLoading(true);
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    console.log("No session found, redirecting to auth");
                    router.replace('/auth');
                    return;
                }

                // If we have a session but no user or company data yet, wait for the main provider to load it
                if (isCompany && !company) {
                    console.log("Waiting for company data to load...");
                } else if (!isCompany && !user) {
                    console.log("Waiting for user data to load...");
                } else {
                    // We have the necessary data, check if company needs onboarding
                    if (isCompany && company && !company.is_onboarded) {
                        console.log("Company needs onboarding");
                        setShowOnboarding(true);
                    }
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error in checkAuth:", error);
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router, isCompany, company, user]);

    // All user/company handling is now done in the main provider

    // Show loading state while data is being fetched
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-500">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // If company onboarding is required, show the form
    if (isCompany && showOnboarding && company) {
        return (
            <CompanyOnboardingForm
                company={company}
                onComplete={() => {
                    setShowOnboarding(false);
                    // Force reload to ensure all components recognize the updated state
                    window.location.href = '/company/dashboard';
                }}
            />
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <div className='w-full p-10'>
                {/* <SidebarTrigger /> */}
                <WelcomeContainer />
                {children}
            </div>
        </SidebarProvider>
    )
}

export default DashboardProvider