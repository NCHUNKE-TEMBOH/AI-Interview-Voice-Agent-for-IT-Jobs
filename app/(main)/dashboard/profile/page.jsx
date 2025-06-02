"use client"
import { useUser } from '@/app/provider'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/services/supabaseClient';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner';
import CVUpload from '@/app/components/CVUpload';
import Image from 'next/image';

function UserProfile() {
    const { user, setUser } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        picture: ''
    });

    // Load user data when component mounts
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                picture: user.picture || ''
            });
        }
    }, [user]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value || ''
        }));
    };

    const handleSave = async () => {
        if (!user?.id) {
            toast.error('User ID not found');
            return;
        }

        if (!formData.name || !formData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('Users')
                .update({
                    name: (formData.name || '').trim(),
                    picture: (formData.picture || '').trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .select();

            if (error) {
                console.error('Error updating user:', error);
                toast.error(`Failed to update profile: ${error.message}`);
                return;
            }

            if (data && data.length > 0) {
                // Update the user context with new data
                setUser(data[0]);
                toast.success('Profile updated successfully!');
            } else {
                toast.success('Profile updated successfully!');
            }
        } catch (error) {
            console.error('Exception updating user:', error);
            toast.error(`Failed to update profile: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCVUpdate = (updatedUser) => {
        // Update the user context when CV is uploaded/deleted
        setUser(updatedUser);
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-6">
                <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">My Profile</h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {/* Profile Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Profile Picture */}
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                {formData.picture ? (
                                    <Image 
                                        src={formData.picture} 
                                        alt='user' 
                                        width={80} 
                                        height={80}
                                        className='w-20 h-20 rounded-full object-cover'
                                    />
                                ) : (
                                    <UserIcon className="h-8 w-8 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="picture">Profile Picture URL</Label>
                                <Input
                                    id="picture"
                                    value={formData.picture}
                                    onChange={(e) => handleInputChange('picture', e.target.value)}
                                    placeholder="https://example.com/profile.jpg"
                                />
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                        
                        {/* Email (Read-only) */}
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                disabled
                                className="bg-gray-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Email cannot be changed
                            </p>
                        </div>

                        {/* Credits Display */}
                        <div>
                            <Label>Available Credits</Label>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="font-medium text-blue-800">
                                    {user?.credits || 0} credits remaining
                                </p>
                                <p className="text-sm text-blue-600">
                                    Credits are used for AI interview sessions
                                </p>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end gap-4">
                            <Button 
                                variant="outline" 
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>Saving...</>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* CV Upload Card */}
                <CVUpload user={user} onCVUpdate={handleCVUpdate} />
            </div>

            {/* Additional Information */}
            <div className="mt-8 max-w-6xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <h4 className="font-medium">Profile Picture</h4>
                                <ul className="text-gray-600 space-y-1">
                                    <li>• Use a professional headshot</li>
                                    <li>• Ensure good lighting and quality</li>
                                    <li>• Face should be clearly visible</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">CV Upload</h4>
                                <ul className="text-gray-600 space-y-1">
                                    <li>• Upload PDF or DOCX format only</li>
                                    <li>• Maximum file size: 5MB</li>
                                    <li>• Keep your CV updated and relevant</li>
                                    <li>• AI will screen your CV for job matches</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default UserProfile
