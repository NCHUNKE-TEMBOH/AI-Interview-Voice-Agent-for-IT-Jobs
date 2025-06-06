"use client"
import React, { useState, useEffect } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { CreditCard, Plus, Zap, BriefcaseIcon, FileText, AlertCircle } from "lucide-react"
import { Progress } from '@/components/ui/progress'
import { useUser } from '@/app/provider'
import PayButton from './_components/PayButton'

function Billing() {
    const { user } = useUser();
    const [usageStats, setUsageStats] = useState({
        totalApplications: 0,
        totalCVUploads: 0,
        remainingApplications: 0,
        remainingCVUploads: 0
    });

    useEffect(() => {
        if (user) {
            calculateUsageStats();
        }
    }, [user]);

    const calculateUsageStats = () => {
        const credits = user?.credits || 0;
        const applicationsUsed = user?.job_applications_count || 0;
        const cvUploadsUsed = user?.cv_upload_count || 0;

        // Each credit allows 1 job application
        // Every 10 credits allow up to 3 CV uploads
        const maxCVUploads = Math.floor(credits / 10) * 3 + (credits % 10 > 0 ? 3 : 0);

        setUsageStats({
            totalApplications: applicationsUsed,
            totalCVUploads: cvUploadsUsed,
            remainingApplications: Math.max(0, credits),
            remainingCVUploads: Math.max(0, maxCVUploads - cvUploadsUsed)
        });
    };
    return (
        <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto grid max-w-6xl gap-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Billing & Credits</h1>
                    <p className="text-muted-foreground">Manage your credits for job applications and CV uploads</p>
                </div>

                {/* Usage Statistics */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{user?.credits || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Credits remaining
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Job Applications</CardTitle>
                            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{usageStats.totalApplications}</div>
                            <p className="text-xs text-muted-foreground">
                                {usageStats.remainingApplications} remaining
                            </p>
                            <Progress
                                value={usageStats.remainingApplications > 0 ?
                                    (usageStats.totalApplications / (usageStats.totalApplications + usageStats.remainingApplications)) * 100 : 100}
                                className="mt-2"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">CV Uploads</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{usageStats.totalCVUploads}</div>
                            <p className="text-xs text-muted-foreground">
                                {usageStats.remainingCVUploads} remaining
                            </p>
                            <Progress
                                value={usageStats.remainingCVUploads > 0 ?
                                    (usageStats.totalCVUploads / (usageStats.totalCVUploads + usageStats.remainingCVUploads)) * 100 : 100}
                                className="mt-2"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Low Credits Warning */}
                {(user?.credits || 0) < 3 && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="flex items-center gap-3 pt-6">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                            <div>
                                <h4 className="font-medium text-orange-800">Low Credits Warning</h4>
                                <p className="text-sm text-orange-700">
                                    You have {user?.credits || 0} credits remaining. Consider purchasing more credits to continue applying for jobs.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 md:grid-cols-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>How Credits Work</CardTitle>
                            <CardDescription>
                                Understand how your credits are used across the platform
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <BriefcaseIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium">Job Applications</h4>
                                            <p className="text-sm text-gray-600">
                                                1 credit per job application. This includes AI interview screening and feedback.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium">CV Uploads</h4>
                                            <p className="text-sm text-gray-600">
                                                1 credit for initial CV upload. Up to 3 uploads per credit package. Replacements are free.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium">What's Included</h4>
                                        <ul className="text-sm text-gray-600 space-y-1 mt-2">
                                            <li>• AI-powered interview screening</li>
                                            <li>• Detailed feedback and scoring</li>
                                            <li>• CV analysis and matching</li>
                                            <li>• Application tracking</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Purchase Credits</CardTitle>
                            <CardDescription>Add credits for job applications and CV uploads</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Starter Pack</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">$9.99</div>
                                        <p className="text-sm text-muted-foreground">5 credits</p>
                                        <ul className="mt-4 grid gap-2 text-sm">
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>5 job applications</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>Up to 3 CV uploads</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>AI interview screening</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>Basic support</span>
                                            </li>
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <PayButton amount={9.99} credits={5} />
                                    </CardFooter>
                                </Card>
                                <Card className="border-blue-200 bg-blue-50/50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Professional Pack</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">$19.99</div>
                                        <p className="text-sm text-muted-foreground">15 credits</p>
                                        <ul className="mt-4 grid gap-2 text-sm">
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>15 job applications</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>Up to 7 CV uploads</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>AI interview screening</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>Priority support</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>Advanced analytics</span>
                                            </li>
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <PayButton amount={19.99} credits={15} />
                                    </CardFooter>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Premium Pack</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">$34.99</div>
                                        <p className="text-sm text-muted-foreground">30 credits</p>
                                        <ul className="mt-4 grid gap-2 text-sm">
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>30 job applications</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>Up to 15 CV uploads</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>AI interview screening</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>Premium support</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>Advanced analytics</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span>Interview coaching tips</span>
                                            </li>
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <PayButton amount={34.99} credits={30} />
                                    </CardFooter>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </main>
    )
}

export default Billing