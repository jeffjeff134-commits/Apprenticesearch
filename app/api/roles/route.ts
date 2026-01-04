import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/roles
 * Fetch apprenticeship roles from Supabase 'jobs' table
 */
export async function GET(request: NextRequest) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json(
                { error: 'Supabase not configured. Please set environment variables.' },
                { status: 503 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const location = searchParams.get('location');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Start building query
        let query = supabase
            .from('jobs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (location) {
            query = query.ilike('location', `%${location}%`);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
        }

        const { data: jobs, error, count } = await query;

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch roles', details: error.message },
                { status: 500 }
            );
        }

        // Transform data to match dashboard format
        const transformedRoles = jobs?.map(job => {
            // Extract skills from attributes JSONB field
            const skills = Array.isArray(job.attributes)
                ? job.attributes.map((attr: any) => attr.name || attr)
                : [];

            return {
                id: job.id,
                title: job.title,
                company: job.company,
                location: job.location,
                salary: job.salary,
                url: job.url,
                skills: skills,
                attributes: job.attributes || [],
                created_at: job.created_at,
            };
        }) || [];

        return NextResponse.json({
            roles: transformedRoles,
            total: count || transformedRoles.length,
            limit,
            offset,
        });

    } catch (error) {
        console.error('Roles API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
