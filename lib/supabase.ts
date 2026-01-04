import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client with placeholders if not configured
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
);

// Helper to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
    return !!(supabaseUrl && supabaseAnonKey);
}

// Database Types matching user's actual schema

/**
 * Jobs table structure
 */
export interface Job {
    id?: string;
    created_at?: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    attributes?: any; // JSONB field for soft skills/candidate attributes
    url: string;
}

/**
 * Profiles table structure
 */
export interface Profile {
    id?: string;
    updated_at?: string;
    first_name: string;
    predicted_grades?: string;
    interests?: any; // JSONB field
    vibe_summary?: string;
}
