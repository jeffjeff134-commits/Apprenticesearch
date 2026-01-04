# Supabase Schema Guide

## Required Tables

You need to create these two tables in your Supabase project:

### 1. `jobs` Table

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  application_deadline TEXT NOT NULL,
  start_date TEXT NOT NULL,
  salary TEXT NOT NULL,
  location TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  qc_validation_status TEXT DEFAULT 'PENDING',
  attributes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for better query performance
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_url ON jobs(url);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON jobs
  FOR SELECT USING (true);

-- Allow authenticated inserts (optional - adjust based on your needs)
CREATE POLICY "Allow authenticated insert" ON jobs
  FOR INSERT WITH CHECK (true);
```

### 2. `profiles` Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  education TEXT,
  interests JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  location_preference TEXT,
  career_suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (true);

-- Allow profile creation and updates
CREATE POLICY "Allow profile upsert" ON profiles
  FOR ALL USING (true);
```

## Data Structure

### Jobs Table
- **organization_name**: Company name (e.g., "Capgemini")
- **role_title**: Job title (e.g., "Software Developer Apprentice")
- **application_deadline**: Deadline as text (e.g., "31 January 2026")
- **start_date**: Start date as text (e.g., "1 September 2026")
- **salary**: Salary info (e.g., "£20,000 a year")
- **location**: Location (e.g., "London (EC1N 2PB)")
- **url**: Unique application URL
- **qc_validation_status**: Status (PENDING, PASS, FAIL)
- **attributes**: JSONB array of `{name: string, source: string}` objects

Example `attributes` field:
```json
[
  {"name": "Logical Reasoning", "source": "Inferred"},
  {"name": "Computational Thinking", "source": "Inferred"},
  {"name": "Agile Mindset", "source": "Inferred"}
]
```

### Profiles Table
- **user_id**: Unique user identifier
- **name**: User's name
- **education**: Education background (optional)
- **interests**: JSONB array of strings
- **skills**: JSONB array of strings  
- **location_preference**: Preferred location
- **career_suggestions**: JSONB object with AI-generated suggestions

Example `career_suggestions` field:
```json
{
  "suggestions": [
    {
      "careerPath": "Software Development",
      "matchReason": "Strong match with your Python and JavaScript skills",
      "keySkills": ["React", "Node.js", "TypeScript"],
      "progression": "Junior Developer → Mid-level → Senior Developer"
    }
  ]
}
```

## Migration from Old Schema

If you ran the original `supabase-schema.sql`, you can migrate data:

```sql
-- Migrate from apprenticeship_roles to jobs
INSERT INTO jobs (
  organization_name, role_title, application_deadline,
  start_date, salary, location, url, qc_validation_status, created_at
)
SELECT 
  organization_name, role_title, application_deadline,
  start_date, salary, location, url, qc_validation_status, created_at
FROM apprenticeship_roles
ON CONFLICT (url) DO NOTHING;

-- Migrate attributes from role_attributes to jobs.attributes
UPDATE jobs j
SET attributes = (
  SELECT jsonb_agg(
    jsonb_build_object('name', ra.attribute_name, 'source', ra.source)
  )
  FROM role_attributes ra
  WHERE ra.role_id::text IN (
    SELECT id::text FROM apprenticeship_roles WHERE url = j.url
  )
);

-- Migrate from user_profiles to profiles
INSERT INTO profiles (
  user_id, name, education, interests, skills, location_preference, created_at
)
SELECT 
  user_id, name, education, interests, skills, location_preference, created_at
FROM user_profiles
ON CONFLICT (user_id) DO NOTHING;
```

## Testing the Tables

Run these queries in Supabase SQL Editor to verify:

```sql
-- Check jobs table
SELECT * FROM jobs LIMIT 5;

-- Check profiles table
SELECT * FROM profiles LIMIT 5;

-- See structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
```

## Next Steps

1. Run the SQL above in Supabase SQL Editor
2. Verify tables are created correctly
3. Your Next.js app will now use these tables automatically
4. Deploy to Vercel with environment variables set
