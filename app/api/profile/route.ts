import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { analyzeCareerPath } from '@/lib/ai';
import { z } from 'zod';

// Validation schema for user profile
const ProfileSchema = z.object({
    user_id: z.string().min(1),
    name: z.string().min(1),
    education: z.string().optional(),
    interests: z.array(z.string()).default([]),
    skills: z.array(z.string()).default([]),
    location_preference: z.string().optional(),
});

/**
 * POST /api/profile
 * Create or update user profile with AI-powered career analysis
 * Saves to Supabase 'profiles' table
 */
export async function POST(request: NextRequest) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json(
                { error: 'Supabase not configured. Please set environment variables.' },
                { status: 503 }
            );
        }

        const body = await request.json();
        const validation = ProfileSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validation.error.issues },
                { status: 400 }
            );
        }

        const profileData = validation.data;

        // Check if profile exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', profileData.user_id)
            .single();

        // Generate AI career suggestions if interests and skills provided
        let careerSuggestions = null;
        if (profileData.interests.length > 0 && profileData.skills.length > 0) {
            try {
                careerSuggestions = await analyzeCareerPath(
                    profileData.interests,
                    profileData.skills
                );
            } catch (aiError) {
                console.error('AI analysis failed:', aiError);
                // Continue without AI suggestions
            }
        }

        let result;

        if (existingProfile) {
            // Update existing profile
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    name: profileData.name,
                    education: profileData.education,
                    interests: profileData.interests,
                    skills: profileData.skills,
                    location_preference: profileData.location_preference,
                    career_suggestions: careerSuggestions,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', profileData.user_id)
                .select()
                .single();

            if (error) {
                return NextResponse.json(
                    { error: 'Failed to update profile', details: error.message },
                    { status: 500 }
                );
            }

            result = data;
        } else {
            // Create new profile
            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    user_id: profileData.user_id,
                    name: profileData.name,
                    education: profileData.education,
                    interests: profileData.interests,
                    skills: profileData.skills,
                    location_preference: profileData.location_preference,
                    career_suggestions: careerSuggestions,
                })
                .select()
                .single();

            if (error) {
                return NextResponse.json(
                    { error: 'Failed to create profile', details: error.message },
                    { status: 500 }
                );
            }

            result = data;
        }

        return NextResponse.json({
            success: true,
            profile: result,
            careerSuggestions,
        });

    } catch (error) {
        console.error('Profile API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/profile?user_id=xxx
 * Retrieve user profile from profiles table
 */
export async function GET(request: NextRequest) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json(
                { error: 'Supabase not configured' },
                { status: 503 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json(
                { error: 'user_id parameter required' },
                { status: 400 }
            );
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Profile not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: 'Failed to fetch profile', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(profile);

    } catch (error) {
        console.error('Profile GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
