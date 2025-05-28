"use client"
import { useUser } from '@/app/provider'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/services/supabaseClient';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner';

function CompanyProfile() {
    const { company, setCompany } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        industry_type: '',
        company_size: '',
        website: '',
        description: '',
        location: '',
        phone: '',
        picture: ''
    });

    // Load company data when component mounts
    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name || '',
                company_email: company.email || '',
                industry_type: company.industry_type || '',
                company_size: company.company_size || '',
                website: company.website || '',
                description: company.description || '',
                address: company.location || '',
                phone: company.phone || '',
                picture: company.picture || ''
            });
        }
    }, [company]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        if (!company?.id) {
            toast.error('Company ID not found');
            return;
        }

        if (!formData.name.trim()) {
            toast.error('Company name is required');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('Companies')
                .update({
                    name: formData.name.trim(),
                    industry_type: formData.industry_type,
                    company_size: formData.company_size,
                    website: formData.website.trim(),
                    description: formData.description.trim(),
                    location: formData.location.trim(),
                    phone: formData.phone.trim(),
                    picture: formData.picture.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', company.id)
                .select();

            if (error) {
                console.error('Error updating company:', error);
                toast.error(`Failed to update profile: ${error.message}`);
                return;
            }

            if (data && data.length > 0) {
                // Update the company context with new data
                setCompany(data[0]);
                toast.success('Profile updated successfully!');
            } else {
                toast.success('Profile updated successfully!');
            }
        } catch (error) {
            console.error('Exception updating company:', error);
            toast.error(`Failed to update profile: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const industryOptions = [
        'Technology',
        'Healthcare',
        'Finance',
        'Education',
        'Manufacturing',
        'Retail',
        'Consulting',
        'Real Estate',
        'Media & Entertainment',
        'Transportation',
        'Energy',
        'Non-Profit',
        'Government',
        'Other'
    ];

    const companySizeOptions = [
        '1-10 employees',
        '11-50 employees',
        '51-200 employees',
        '201-500 employees',
        '501-1000 employees',
        '1000+ employees'
    ];

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
                <h1 className="text-2xl font-bold">Company Profile</h1>
            </div>

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Edit Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Company Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter company name"
                            />
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="company@example.com"
                                disabled
                                className="bg-gray-50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="industry">Industry</Label>
                            <Select
                                value={formData.industry_type}
                                onValueChange={(value) => handleInputChange('industry_type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent>
                                    {industryOptions.map((industry) => (
                                        <SelectItem key={industry} value={industry}>
                                            {industry}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="company_size">Company Size</Label>
                            <Select
                                value={formData.company_size}
                                onValueChange={(value) => handleInputChange('company_size', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select company size" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companySizeOptions.map((size) => (
                                        <SelectItem key={size} value={size}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                value={formData.website}
                                onChange={(e) => handleInputChange('website', e.target.value)}
                                placeholder="https://www.company.com"
                            />
                        </div>

                        <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="City, State, Country"
                        />
                    </div>

                    <div>
                        <Label htmlFor="picture">Company Logo URL</Label>
                        <Input
                            id="picture"
                            value={formData.picture}
                            onChange={(e) => handleInputChange('picture', e.target.value)}
                            placeholder="https://example.com/logo.png"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Company Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Tell us about your company..."
                            rows={4}
                        />
                    </div>

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
        </div>
    )
}

export default CompanyProfile
