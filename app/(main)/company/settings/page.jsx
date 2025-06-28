"use client"
import { useUser } from '@/app/provider'
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/services/supabaseClient';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react'

function CompanySettings() {
    const { company } = useUser();
    const router = useRouter();

    const onSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error signing out:', error);
            } else {
                // Clear any local storage or session data if needed
                localStorage.removeItem('userType');
                router.replace('/auth');
            }
        } catch (error) {
            console.error('Exception during sign out:', error);
            router.replace('/auth');
        }
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Company Settings</h1>

            <Card className="w-full max-w-md mx-auto overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        <div className="w-[70px] h-[70px] rounded-full bg-blue-100 flex items-center justify-center">
                            {company?.picture && company.picture.trim() !== '' ? (
                                <Image
                                    src={company.picture}
                                    alt='company'
                                    width={70}
                                    height={70}
                                    className='w-[70px] h-[70px] rounded-full object-cover'
                                />
                            ) : (
                                <div className="text-2xl font-bold text-blue-600">
                                    {company?.name?.charAt(0)?.toUpperCase() || 'C'}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-center sm:items-start">
                            <h3 className="text-lg font-medium">{company?.name || 'Company Name'}</h3>
                            <p className="text-sm text-muted-foreground">{company?.email || 'company@example.com'}</p>
                            {company?.industry_type && (
                                <p className="text-xs text-gray-500 mt-1">{company.industry_type}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push('/company/profile')}
                        >
                            Edit Profile
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={onSignOut}
                        >
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default CompanySettings
