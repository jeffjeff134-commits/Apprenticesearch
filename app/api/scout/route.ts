import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { inferAttributes } from '@/lib/attributes';
import { z } from 'zod';

// Validation schema for incoming job data
const JobSchema = z.object({
    title: z.string().min(1),
    company: z.string().min(1),
    location: z.string().min(1),
    salary: z.string().min(1),
    url: z.string().url(),
});

const BulkJobsSchema = z.object({
    jobs: z.array(JobSchema),
});

/**
 * POST /api/scout
 * Add new apprenticeship job(s) with automatic attribute inference
 * Saves to Supabase 'jobs' table
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

        // Support both single job and bulk upload
        const isBulk = 'jobs' in body;
        const validation = isBulk
            ? BulkJobsSchema.safeParse(body)
            : z.object({ job: JobSchema }).safeParse({ job: body });

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request data', details: validation.error.issues },
                { status: 400 }
            );
        }

        const jobsToProcess = isBulk
            ? (validation.data as { jobs: z.infer<typeof JobSchema>[] }).jobs
            : [(validation.data as { job: z.infer<typeof JobSchema> }).job];

        const results = [];
        const errors = [];

        for (const jobData of jobsToProcess) {
            try {
                // Check if job already exists (by URL)
                const { data: existing } = await supabase
                    .from('jobs')
                    .select('id')
                    .eq('url', jobData.url)
                    .single();

                if (existing) {
                    errors.push({
                        url: jobData.url,
                        error: 'Job already exists'
                    });
                    continue;
                }

                // Infer attributes based on title and company
                const inferredAttributes = inferAttributes(
                    jobData.title,
                    jobData.company
                );

                // Prepare attributes as array of objects for JSONB storage
                const attributeObjects = inferredAttributes.map(attr => ({
                    name: attr,
                    source: 'Inferred'
                }));

                // Insert the job
                const { data: insertedJob, error: jobError } = await supabase
                    .from('jobs')
                    .insert({
                        title: jobData.title,
                        company: jobData.company,
                        location: jobData.location,
                        salary: jobData.salary,
                        url: jobData.url,
                        attributes: attributeObjects, // Store as JSONB
                    })
                    .select()
                    .single();

                if (jobError || !insertedJob) {
                    errors.push({
                        url: jobData.url,
                        error: jobError?.message || 'Failed to insert job'
                    });
                    continue;
                }

                results.push({
                    id: insertedJob.id,
                    url: insertedJob.url,
                    attributes_inferred: inferredAttributes.length,
                });
            } catch (err) {
                errors.push({
                    url: jobData.url,
                    error: err instanceof Error ? err.message : 'Unknown error'
                });
            }
        }

        return NextResponse.json({
            success: true,
            inserted: results.length,
            failed: errors.length,
            results,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error) {
        console.error('Scout API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/scout/stats
 * Get statistics about scouted jobs
 */
export async function GET(request: NextRequest) {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json(
                { error: 'Supabase not configured' },
                { status: 503 }
            );
        }

        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('id, created_at');

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch statistics', details: error.message },
                { status: 500 }
            );
        }

        const stats = {
            total: jobs?.length || 0,
            latest_date: jobs && jobs.length > 0
                ? jobs[0].created_at
                : null,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Scout stats error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
