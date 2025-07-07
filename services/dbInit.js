import { supabase } from './supabaseClient';

/**
 * Initialize database tables if they don't exist..
 * This function will be called when the application starts
 */
export const initializeDatabase = async () => {
  console.log('Initializing database...');
  
  try {
    // Check if the Companies table exists
    const { error: companiesError } = await supabase
      .from('Companies')
      .select('id')
      .limit(1);
    
    if (companiesError && companiesError.code === '42P01') {
      console.log('Creating Companies table...');
      // Create Companies table
      await supabase.rpc('create_companies_table');
    }
    
    // Check if the Jobs table exists
    const { error: jobsError } = await supabase
      .from('Jobs')
      .select('id')
      .limit(1);
    
    if (jobsError && jobsError.code === '42P01') {
      console.log('Creating Jobs table...');
      // Create Jobs table
      await supabase.rpc('create_jobs_table');
    }
    
    // Check if the Job_Submissions table exists
    const { error: submissionsError } = await supabase
      .from('Job_Submissions')
      .select('id')
      .limit(1);
    
    if (submissionsError && submissionsError.code === '42P01') {
      console.log('Creating Job_Submissions table...');
      // Create Job_Submissions table
      await supabase.rpc('create_job_submissions_table');
    }
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

/**
 * Create stored procedures for table creation
 * These need to be created manually in the Supabase SQL editor
 */
export const createStoredProcedures = async () => {
  // This is just a reference for the SQL you need to run in the Supabase SQL editor
  const createCompaniesTableSQL = `
  CREATE OR REPLACE FUNCTION create_companies_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS "Companies" (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email TEXT NOT NULL,
      name TEXT,
      address TEXT,
      phone TEXT,
      website TEXT,
      description TEXT,
      industry_type TEXT,
      company_email TEXT,
      picture TEXT,
      is_onboarded BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add RLS policies
    ALTER TABLE "Companies" ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Companies are viewable by everyone"
      ON "Companies" FOR SELECT
      USING (true);
      
    CREATE POLICY "Companies can be inserted by authenticated users"
      ON "Companies" FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
      
    CREATE POLICY "Companies can be updated by the owner"
      ON "Companies" FOR UPDATE
      USING (auth.email() = email);
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  const createJobsTableSQL = `
  CREATE OR REPLACE FUNCTION create_jobs_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS "Jobs" (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      company_id UUID REFERENCES "Companies"(id),
      job_title TEXT NOT NULL,
      employment_type TEXT,
      location_type TEXT,
      salary_range TEXT,
      application_deadline DATE,
      job_start_date DATE,
      job_description TEXT,
      experience_level TEXT,
      required_skills TEXT,
      ai_criteria TEXT,
      question_count INTEGER DEFAULT 10,
      interview_type TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add RLS policies
    ALTER TABLE "Jobs" ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Jobs are viewable by everyone"
      ON "Jobs" FOR SELECT
      USING (true);
      
    CREATE POLICY "Jobs can be inserted by authenticated users"
      ON "Jobs" FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
      
    CREATE POLICY "Jobs can be updated by the company owner"
      ON "Jobs" FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM "Companies"
        WHERE "Companies".id = "Jobs".company_id
        AND "Companies".email = auth.email()
      ));
      
    CREATE POLICY "Jobs can be deleted by the company owner"
      ON "Jobs" FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM "Companies"
        WHERE "Companies".id = "Jobs".company_id
        AND "Companies".email = auth.email()
      ));
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  const createJobSubmissionsTableSQL = `
  CREATE OR REPLACE FUNCTION create_job_submissions_table()
  RETURNS void AS $$
  BEGIN
    CREATE TABLE IF NOT EXISTS "Job_Submissions" (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      job_id UUID REFERENCES "Jobs"(id),
      user_name TEXT,
      user_email TEXT,
      feedback JSONB,
      score INTEGER,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add RLS policies
    ALTER TABLE "Job_Submissions" ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Job_Submissions are viewable by everyone"
      ON "Job_Submissions" FOR SELECT
      USING (true);
      
    CREATE POLICY "Job_Submissions can be inserted by authenticated users"
      ON "Job_Submissions" FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
      
    CREATE POLICY "Job_Submissions can be updated by the company owner"
      ON "Job_Submissions" FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM "Jobs"
        JOIN "Companies" ON "Jobs".company_id = "Companies".id
        WHERE "Jobs".id = "Job_Submissions".job_id
        AND "Companies".email = auth.email()
      ));
  END;
  $$ LANGUAGE plpgsql;
  `;
  
  console.log('SQL for stored procedures:');
  console.log(createCompaniesTableSQL);
  console.log(createJobsTableSQL);
  console.log(createJobSubmissionsTableSQL);
};
