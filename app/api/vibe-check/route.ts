import { google } from '@ai-sdk/google';
import { streamText, type UIMessage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { z } from 'zod';

// For chat, we expect a list of messages
const ChatSchema = z.object({
    messages: z.array(z.any()),
});

/**
 * POST /api/vibe-check
 * Streaming chat handler for the Vibe-Check agent
 */
export async function POST(req: NextRequest) {
    try {
        // We only need Google API Key for chat. Supabase is optional for profile enrichment.

        const body = await req.json();
        const { messages } = ChatSchema.parse(body);

        const result = await streamText({
            model: google('gemini-1.5-flash'),
            system: `You are the Vibe-Check agent, a career discovery and apprenticeship assistant.
            Your goal is to help students find their path through degree apprenticeships.
            Be encouraging, professional, and insightful. 
            When appropriate, ask about their interests, grades, and career goals.
            You can reference digital, engineering, business, and finance apprenticeship paths.`,
            messages,
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error('Vibe-Check Chat API error:', error);
        return new Response('Internal server error', { status: 500 });
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
