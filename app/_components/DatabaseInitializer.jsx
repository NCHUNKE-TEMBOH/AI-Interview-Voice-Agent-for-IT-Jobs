"use client"

import { useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';

export default function DatabaseInitializer() {
  useEffect(() => {
    const initializeDatabase = async () => {
      console.log('Checking database tables...');
      
      try {
        // Check if Companies table exists and create it if needed
        const { data: companiesData, error: companiesError } = await supabase
          .from('Companies')
          .select('count(*)')
          .limit(1)
          .single();
        
        if (companiesError && companiesError.code === '42P01') {
          console.log('Companies table does not exist, creating it...');
          await createCompaniesTable();
        } else {
          console.log('Companies table exists');
        }
        
        // Check if Jobs table exists and create it if needed
        const { data: jobsData, error: jobsError } = await supabase
          .from('Jobs')
          .select('count(*)')
          .limit(1)
          .single();
        
        if (jobsError && jobsError.code === '42P01') {
          console.log('Jobs table does not exist, creating it...');
          await createJobsTable();
        } else {
          console.log('Jobs table exists');
        }
        
        // Check if Job_Submissions table exists and create it if needed
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('Job_Submissions')
          .select('count(*)')
          .limit(1)
          .single();
        
        if (submissionsError && submissionsError.code === '42P01') {
          console.log('Job_Submissions table does not exist, creating it...');
          await createJobSubmissionsTable();
        } else {
          console.log('Job_Submissions table exists');
        }
        
        console.log('Database initialization complete');
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    
    // Create Companies table
    const createCompaniesTable = async () => {
      const { error } = await supabase.rpc('create_companies_table');
      if (error) {
        console.error('Error creating Companies table:', error);
        
        // If RPC fails, try direct SQL (this requires more permissions)
        console.log('Attempting to create Companies table directly...');
        await createCompaniesTableDirect();
      }
    };
    
    // Create Jobs table
    const createJobsTable = async () => {
      const { error } = await supabase.rpc('create_jobs_table');
      if (error) {
        console.error('Error creating Jobs table:', error);
        
        // If RPC fails, try direct SQL (this requires more permissions)
        console.log('Attempting to create Jobs table directly...');
        await createJobsTableDirect();
      }
    };
    
    // Create Job_Submissions table
    const createJobSubmissionsTable = async () => {
      const { error } = await supabase.rpc('create_job_submissions_table');
      if (error) {
        console.error('Error creating Job_Submissions table:', error);
        
        // If RPC fails, try direct SQL (this requires more permissions)
        console.log('Attempting to create Job_Submissions table directly...');
        await createJobSubmissionsTableDirect();
      }
    };
    
    // Direct SQL methods (these require more permissions)
    const createCompaniesTableDirect = async () => {
      // This is a fallback method that requires more permissions
      console.log('Please create the Companies table manually in Supabase');
      alert('Database setup required: Please create the Companies table in Supabase');
    };
    
    const createJobsTableDirect = async () => {
      // This is a fallback method that requires more permissions
      console.log('Please create the Jobs table manually in Supabase');
      alert('Database setup required: Please create the Jobs table in Supabase');
    };
    
    const createJobSubmissionsTableDirect = async () => {
      // This is a fallback method that requires more permissions
      console.log('Please create the Job_Submissions table manually in Supabase');
      alert('Database setup required: Please create the Job_Submissions table in Supabase');
    };
    
    // Run the initialization
    initializeDatabase();
  }, []);
  
  // This component doesn't render anything
  return null;
}
