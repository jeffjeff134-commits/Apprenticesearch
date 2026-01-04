import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { analyzeCareerPath } from '@/lib/ai';
import { z } from 'zod';

// Validation schema for user profile (Vibe-Check)
const ProfileSchema = z.object({
    first_name: z.string().min(1),
    predicted_grades: z.string().optional(),
    interests: z.array(z.string()).default([]),
    vibe_summary: z.string().optional(),
});

// For updates, we need an identifier
const ProfileWithIdSchema = ProfileSchema.extend({
    id: z.string().uuid().optional(),
});

/**
 * POST /api/vibe-check
 * Create or update user profile with Vibe-Check analysis
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
        const validation = ProfileWithIdSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validation.error.issues },
                { status: 400 }
            );
        }

        const profileData = validation.data;

        // Generate vibe summary with AI if interests provided
        let generatedVibeSummary = profileData.vibe_summary;

        if (!generatedVibeSummary && profileData.interests.length > 0) {
            try {
                const careerAnalysis = await analyzeCareerPath(
                    profileData.interests,
                    [] // No skills in this schema
                );

                // Create a vibe summary from AI analysis
                if (careerAnalysis && careerAnalysis.suggestions) {
                    const topSuggestion = careerAnalysis.suggestions[0];
                    generatedVibeSummary = `Based on your interests in ${profileData.interests.join(', ')}, you show strong alignment with ${topSuggestion.careerPath}. ${topSuggestion.matchReason}`;
                }
            } catch (aiError) {
                console.error('AI analysis failed:', aiError);
                // Use a simple fallback
                generatedVibeSummary = `Interested in ${profileData.interests.join(', ')}. Great potential for apprenticeships in these areas!`;
            }
        }

        let result;

        if (profileData.id) {
            // Update existing profile
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    first_name: profileData.first_name,
                    predicted_grades: profileData.predicted_grades,
                    interests: profileData.interests,
                    vibe_summary: generatedVibeSummary,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profileData.id)
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
                    first_name: profileData.first_name,
                    predicted_grades: profileData.predicted_grades,
                    interests: profileData.interests,
                    vibe_summary: generatedVibeSummary,
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
        });

    } catch (error) {
        console.error('Vibe-Check API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/vibe-check?id=xxx
 * Retrieve user profile by ID
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
        const profileId = searchParams.get('id');
        const firstName = searchParams.get('first_name');

        if (profileId) {
            // Query by ID
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
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
        } else if (firstName) {
            // Query by first name
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('first_name', firstName)
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
        } else {
            // Return all profiles
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*');

            if (error) {
                return NextResponse.json(
                    { error: 'Failed to fetch profiles', details: error.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({ profiles: profiles || [] });
        }

    } catch (error) {
        console.error('Vibe-Check GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
