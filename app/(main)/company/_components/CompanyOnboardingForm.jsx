"use client"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/services/supabaseClient';
import { Building2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const industryTypes = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Media",
  "Transportation",
  "Construction",
  "Energy",
  "Agriculture",
  "Hospitality",
  "Real Estate",
  "Legal Services",
  "Consulting",
  "Other"
];

function CompanyOnboardingForm({ company, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [companyData, setCompanyData] = useState(null);

  // Fetch company data if not provided
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!company) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('Companies')
              .select('*')
              .eq('email', user.email)
              .single();

            if (data) {
              setCompanyData(data);
            } else if (error) {
              console.error('Error fetching company data:', error);
            }
          }
        } catch (error) {
          console.error('Error in fetchCompanyData:', error);
        }
      } else {
        setCompanyData(company);
      }
    };

    fetchCompanyData();
  }, [company]);

  // Initialize form data once company data is available
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    industry_type: '',
    company_email: '',
  });

  // Update form data when company data changes
  useEffect(() => {
    if (companyData) {
      setFormData({
        name: companyData.name || '',
        address: companyData.address || '',
        phone: companyData.phone || '',
        website: companyData.website || '',
        description: companyData.description || '',
        industry_type: companyData.industry_type || '',
        company_email: companyData.company_email || companyData.email || '',
      });
    }
  }, [companyData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!companyData) {
        console.error('No company data available');
        toast.error('Company data not available. Please try again.');
        setLoading(false);
        return;
      }

      console.log("Updating company with ID:", companyData.id);
      console.log("Form data:", formData);

      // Update company information
      const { data, error } = await supabase
        .from('Companies')
        .update({
          ...formData,
          is_onboarded: true
        })
        .eq('id', companyData.id)
        .select();

      if (error) {
        throw error;
      }

      console.log("Company updated successfully:", data);

      // Update local storage to remember this company has been onboarded
      localStorage.setItem('company_onboarded_' + companyData.id, 'true');

      toast.success('Company profile updated successfully!');
      setStep(2);

      // After a delay, complete the onboarding and redirect to dashboard
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
        // Force reload to ensure all components recognize the updated state
        window.location.href = '/company/dashboard';
      }, 2000);
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Failed to update company profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Image src={'/logo2.png'} alt="logo" width={180} height={60} />
          </div>
          <CardTitle className="text-2xl">Company Onboarding</CardTitle>
          <CardDescription>
            {step === 1
              ? "Please provide your company details to get started"
              : "Your company profile has been created successfully!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry_type">Industry</Label>
                  <Select
                    value={formData.industry_type}
                    onValueChange={(value) => handleInputChange('industry_type', value)}
                    required
                  >
                    <SelectTrigger id="industry_type">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industryTypes.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_email">Company Email</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={formData.company_email}
                    onChange={(e) => handleInputChange('company_email', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    required
                    className="min-h-[120px]"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Complete Setup'}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Setup Complete!</h3>
              <p className="text-center text-gray-500">
                Your company profile has been created successfully. You will now be redirected to your dashboard.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CompanyOnboardingForm;
