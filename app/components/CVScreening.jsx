"use client"
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/services/supabaseClient';
import { Eye, FileText, Trash2, Download, Brain, Star, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CVScreening({ user, company, job, onScreeningComplete }) {
  const [screening, setScreening] = useState(false);
  const [screeningResult, setScreeningResult] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleScreenCV = async () => {
    if (!user?.cv_url || !company?.id || !job?.id) {
      toast.error('Missing required information for screening');
      return;
    }

    setScreening(true);
    try {
      // First, extract text from CV (this would typically be done on the backend)
      // For now, we'll simulate the screening process
      
      // Simulate API call to Gemini for CV screening
      const screeningData = await simulateGeminiScreening(user, job);
      
      // Save screening result to database
      const { data, error } = await supabase
        .from('CV_Screening_Results')
        .insert([
          {
            user_id: user.id,
            company_id: company.id,
            job_id: job.id,
            match_score: screeningData.matchScore,
            summary: screeningData.summary,
            skills_match: screeningData.skillsMatch,
            experience_relevance: screeningData.experienceRelevance,
            education_match: screeningData.educationMatch,
            screening_data: screeningData,
            screened_by: company.id,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.error('Error saving screening result:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));

        // If table doesn't exist, continue without saving but show result
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('CV_Screening_Results table does not exist, showing result without saving');
          setScreeningResult({
            id: Date.now(),
            match_score: screeningData.matchScore,
            summary: screeningData.summary,
            skills_match: screeningData.skillsMatch,
            experience_relevance: screeningData.experienceRelevance,
            education_match: screeningData.educationMatch,
            screening_data: screeningData
          });
          toast.success('CV screening completed! (Note: Results not saved to database)');

          if (onScreeningComplete) {
            onScreeningComplete({
              match_score: screeningData.matchScore,
              summary: screeningData.summary
            });
          }
          return;
        }

        toast.error(`Failed to save screening result: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        setScreeningResult(data[0]);
        toast.success('CV screening completed successfully!');
        
        if (onScreeningComplete) {
          onScreeningComplete(data[0]);
        }
      }

    } catch (error) {
      console.error('Exception during screening:', error);
      toast.error(`Screening failed: ${error.message}`);
    } finally {
      setScreening(false);
    }
  };

  // Simulate Gemini API screening (replace with actual API call)
  const simulateGeminiScreening = async (user, job) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock screening result based on job requirements
    const skills = job.required_skills?.toLowerCase() || '';
    const jobDescription = job.job_description?.toLowerCase() || '';
    
    // Simple matching logic (replace with actual Gemini API)
    let matchScore = Math.floor(Math.random() * 3) + 7; // 7-10 range
    
    const skillsMatch = `Strong match in ${skills.split(',').slice(0, 3).join(', ')}. Some gaps in advanced frameworks.`;
    const experienceRelevance = `${Math.floor(Math.random() * 3) + 3} years relevant experience. Good progression in career.`;
    const educationMatch = 'Educational background aligns well with job requirements.';
    const summary = `Candidate shows ${matchScore >= 8 ? 'excellent' : 'good'} potential for this role. ${matchScore >= 8 ? 'Highly recommended' : 'Recommended'} for interview.`;

    return {
      matchScore,
      summary,
      skillsMatch,
      experienceRelevance,
      educationMatch,
      detailedAnalysis: {
        strengths: ['Technical skills', 'Experience level', 'Career progression'],
        weaknesses: ['Some skill gaps', 'Limited exposure to specific tools'],
        recommendations: ['Consider for technical interview', 'Assess practical skills']
      }
    };
  };

  const handleViewCV = () => {
    if (user?.cv_url) {
      window.open(user.cv_url, '_blank');
    }
  };

  const handleDownloadCV = () => {
    if (user?.cv_url) {
      const link = document.createElement('a');
      link.href = user.cv_url;
      link.download = user.cv_filename || `${user.name}_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteCV = async () => {
    if (!user?.cv_url) return;

    try {
      // Extract file path from URL
      const urlParts = user.cv_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('cv-uploads')
        .remove([filePath]);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        toast.error(`Failed to delete CV: ${deleteError.message}`);
        return;
      }

      // Update user record
      const { error: updateError } = await supabase
        .from('Users')
        .update({
          cv_url: null,
          cv_filename: null,
          cv_uploaded_at: null
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        toast.error(`Failed to update user record: ${updateError.message}`);
        return;
      }

      toast.success('CV deleted successfully');
      setDeleteDialogOpen(false);

    } catch (error) {
      console.error('Exception during delete:', error);
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score) => {
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
    return 'destructive';
  };

  if (!user?.cv_url) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No CV uploaded by this candidate</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          CV Screening
        </CardTitle>
        <CardDescription>
          View and analyze candidate's CV with AI-powered screening
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CV Info */}
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <p className="font-medium text-blue-800">CV Available</p>
            <p className="text-sm text-blue-600">
              {user.cv_filename} • Uploaded {new Date(user.cv_uploaded_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleViewCV}>
            <Eye className="h-4 w-4 mr-2" />
            View CV
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadCV}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button 
            onClick={handleScreenCV}
            disabled={screening}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {screening ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Screening...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Screen with AI
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete CV
          </Button>
        </div>

        {/* Screening Progress */}
        {screening && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>AI Screening in Progress...</span>
              <span>Analyzing CV content</span>
            </div>
            <Progress value={75} className="w-full" />
            <p className="text-xs text-gray-500">
              This may take a few moments while our AI analyzes the CV content
            </p>
          </div>
        )}

        {/* Screening Result */}
        {screeningResult && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">AI Screening Result</h3>
              <Badge variant={getScoreBadgeVariant(screeningResult.match_score)}>
                <Star className="h-3 w-3 mr-1" />
                {screeningResult.match_score}/10
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">Summary</h4>
                <p className="text-sm text-gray-600">{screeningResult.summary}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm">Skills Match</h4>
                <p className="text-sm text-gray-600">{screeningResult.skills_match}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm">Experience Relevance</h4>
                <p className="text-sm text-gray-600">{screeningResult.experience_relevance}</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewDialogOpen(true)}
              className="w-full"
            >
              View Detailed Analysis
            </Button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete CV</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this candidate's CV? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCV}>
                Delete CV
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detailed Analysis Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detailed CV Analysis</DialogTitle>
              <DialogDescription>
                AI-powered analysis of {user.name}'s CV for {job?.job_title}
              </DialogDescription>
            </DialogHeader>
            {screeningResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(screeningResult.match_score)}`}>
                      {screeningResult.match_score}/10
                    </div>
                    <p className="text-sm text-gray-500">Match Score</p>
                  </div>
                  <div className="flex-1">
                    <Progress value={screeningResult.match_score * 10} className="w-full" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Skills Assessment</h4>
                    <p className="text-sm text-gray-600">{screeningResult.skills_match}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Experience Level</h4>
                    <p className="text-sm text-gray-600">{screeningResult.experience_relevance}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Education Match</h4>
                    <p className="text-sm text-gray-600">{screeningResult.education_match}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Overall Summary</h4>
                    <p className="text-sm text-gray-600">{screeningResult.summary}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
