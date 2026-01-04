#!/usr/bin/env ts-node
/**
 * Migration script to transfer data from local JSON files to Supabase
 * Run this once after setting up your Supabase database
 * 
 * Usage:
 * 1. Set up NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 * 2. Run: npx tsx scripts/migrate-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateRoles() {
    console.log('📦 Starting roles migration...\n');

    // Read roles_db.json
    const rolesPath = path.join(process.cwd(), 'roles_db.json');

    if (!fs.existsSync(rolesPath)) {
        console.error('❌ roles_db.json not found');
        return;
    }

    const rolesData = JSON.parse(fs.readFileSync(rolesPath, 'utf-8'));

    console.log(`Found ${rolesData.length} roles to migrate\n`);

    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (const role of rolesData) {
        try {
            // Check if already exists
            const { data: existing } = await supabase
                .from('apprenticeship_roles')
                .select('id')
                .eq('url', role.url)
                .single();

            if (existing) {
                console.log(`⏭️  Skipped: ${role.role_title} (already exists)`);
                skipped++;
                continue;
            }

            // Insert role
            const { data: insertedRole, error: roleError } = await supabase
                .from('apprenticeship_roles')
                .insert({
                    organization_name: role.organization_name,
                    role_title: role.role_title,
                    application_deadline: role.application_deadline,
                    start_date: role.start_date,
                    salary: role.salary,
                    location: role.location,
                    url: role.url,
                    qc_validation_status: role.qc_validation?.status || 'PENDING',
                    qc_validation_timestamp: role.qc_validation?.timestamp || null,
                })
                .select()
                .single();

            if (roleError || !insertedRole) {
                console.error(`❌ Failed: ${role.role_title}`, roleError?.message);
                failed++;
                continue;
            }

            // Insert attributes
            if (role.attributes && role.attributes.length > 0) {
                const attributeRecords = role.attributes.map((attr: any) => ({
                    role_id: insertedRole.id,
                    attribute_name: attr.name,
                    source: attr.source || 'Inferred',
                }));

                const { error: attrError } = await supabase
                    .from('role_attributes')
                    .insert(attributeRecords);

                if (attrError) {
                    console.error(`⚠️  Attributes failed for ${role.role_title}:`, attrError.message);
                } else {
                    console.log(`✅ Migrated: ${role.role_title} (${role.attributes.length} attributes)`);
                }
            } else {
                console.log(`✅ Migrated: ${role.role_title} (no attributes)`);
            }

            succeeded++;

        } catch (error) {
            console.error(`❌ Error migrating ${role.role_title}:`, error);
            failed++;
        }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Succeeded: ${succeeded}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
}

async function migrateUserProfile() {
    console.log('\n👤 Migrating user profile...\n');

    const profilePath = path.join(process.cwd(), 'user_profile.json');

    if (!fs.existsSync(profilePath)) {
        console.log('⏭️  No user_profile.json found, skipping');
        return;
    }

    const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));

    try {
        // Use a default user_id (can be customized)
        const userId = 'default_user';

        const { data, error } = await supabase
            .from('user_profiles')
            .upsert({
                user_id: userId,
                name: profileData.name,
                education: profileData.education,
                interests: profileData.interests || [],
                skills: profileData.skills || [],
                location_preference: profileData.location_preference,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Failed to migrate user profile:', error.message);
        } else {
            console.log(`✅ User profile migrated: ${data.name}`);
        }
    } catch (error) {
        console.error('❌ Error migrating user profile:', error);
    }
}

async function main() {
    console.log('🚀 Supabase Migration Tool\n');
    console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

    await migrateRoles();
    await migrateUserProfile();

    console.log('\n✨ Migration complete!\n');
}

main().catch(console.error);
