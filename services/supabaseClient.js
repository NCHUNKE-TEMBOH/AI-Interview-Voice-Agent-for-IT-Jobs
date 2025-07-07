import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Get the correct redirect URL based on environment
const getRedirectURL = () => {
    if (typeof window !== 'undefined') {
        // Client-side: use current origin
        return window.location.origin;
    }
    // Server-side: use environment variable or default
    return process.env.NEXT_PUBLIC_APP_URL || 'https://skillin.vercel.app';
};

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            redirectTo: getRedirectURL()
        }
    }
)