# Scout Apprenticeship Search - Web API Conversion

This application has been converted from local file-based operations to a full-stack web application using Next.js, Vercel AI SDK, and Supabase.

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 16.1.1 with App Router
- **Styling**: Tailwind CSS
- **State**: React Hooks (client-side data fetching)

### Backend
- **API Routes**: Next.js serverless functions
- **Database**: Supabase (PostgreSQL)
- **AI**: Vercel AI SDK with Google Gemini

### Agents (Now as API Routes)

#### Scout Agent (`/api/scout`)
- Processes apprenticeship role data
- Applies automatic attribute inference
- Stores roles in Supabase
- Supports bulk uploads

#### Vibe-Check Agent (`/api/profile`)
- User profile management
- AI-powered career path analysis
- Stores user data in Supabase

#### Roles API (`/api/roles`)
- Fetches apprenticeship roles with filtering
- Supports pagination and search

## 🚀 Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the schema from `supabase-schema.sql`:
   ```bash
   # Copy the contents of supabase-schema.sql and run in Supabase SQL Editor
   ```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Google Gemini API Key (for Vercel AI SDK)
GOOGLE_GENERATIVE_AI_API_KEY=your_openai_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get your Supabase credentials from: **Project Settings → API**

### 3. Migrate Existing Data

To migrate data from `roles_db.json` and `user_profile.json` to Supabase:

```bash
# Install tsx if needed
npm install -D ts-node

# Run migration
npx tsx scripts/migrate-to-supabase.ts
```

### 4. Run Locally

```bash
# Install dependencies (if you haven't already)
/usr/local/bin/npm install

# Run development server
/usr/local/bin/npm run dev

# Visit http://localhost:3000
```

## 📡 API Endpoints

### Scout Agent

**POST /api/scout**  
Add new apprenticeship role(s)

```json
// Single role
{
  "organization_name": "Company Name",
  "role_title": "Software Developer Apprentice",
  "application_deadline": "31 January 2026",
  "start_date": "1 September 2026",
  "salary": "£20,000",
  "location": "London",
  "url": "https://example.com/role"
}

// Bulk upload
{
  "roles": [
    { /* role data */ },
    { /* role data */ }
  ]
}
```

**GET /api/scout/stats**  
Get statistics about scouted roles

### Profile Agent (Vibe-Check)

**POST /api/profile**  
Create or update user profile

```json
{
  "user_id": "user123",
  "name": "Jane Doe",
  "education": "A-Levels",
  "interests": ["Software Development", "AI"],
  "skills": ["Python", "JavaScript"],
  "location_preference": "London"
}
```

**GET /api/profile?user_id=user123**  
Retrieve user profile

### Roles API

**GET /api/roles**  
Fetch apprenticeship roles

Query parameters:
- `location` - Filter by location (partial match)
- `search` - Search in title or organization
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

## 🎯 Usage

### Adding Roles via API

You can use any HTTP client (Postman, curl, etc.) to add roles:

```bash
curl -X POST http://localhost:3000/api/scout \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "Test Company",
    "role_title": "Software Engineer Apprentice",
    "application_deadline": "31 Jan 2026",
    "start_date": "1 Sep 2026",
    "salary": "£25,000",
    "location": "Manchester",
    "url": "https://example.com/unique-role-url"
  }'
```

### Querying Roles

The dashboard automatically fetches from `/api/roles`. You can also query directly:

```bash
curl "http://localhost:3000/api/roles?location=London&limit=10"
```

## 📦 Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── scout/route.ts       # Scout agent endpoint
│   │   ├── profile/route.ts     # Vibe-Check agent endpoint
│   │   └── roles/route.ts       # Roles fetching endpoint
│ │   └── page.tsx               # Main dashboard (client component)
├── lib/
│   ├── supabase.ts              # Supabase client & types
│   ├── attributes.ts            # Attribute inference logic
│   └── ai.ts                    # AI utilities (Vercel AI SDK)
├── scripts/
│   ├── migrate-to-supabase.ts   # Data migration script
│   └── apply_attributes.py       # Original Python script (archived)
├── supabase-schema.sql          # Database schema
└── data/                        # Original JSON files (archived)
```

## 🔄 Attribute Inference

The system automatically infers attributes for roles based on keywords:

- **Digital/Software**: Logical Reasoning, Computational Thinking, Agile Mindset
- **Engineering/Manufacturing**: Manual Dexterity, Health & Safety Awareness, Systems Thinking
- **Audit/Finance**: Numerical Literacy, Professional Integrity, Stakeholder Management
- **Business/Project Management**: Time Management, Conflict Resolution, Commercial Awareness

### AI Features (Google Gemini)

The system uses Google Gemini (via Vercel AI SDK) for:
- **Career Path Analysis**: Intelligent suggestions based on student profile.
- **Application Advice**: Personalized tips for specific roles.
- **Match Scoring**: Advanced similarity calculation between users and roles.

> [!NOTE]
> If `GOOGLE_GENERATIVE_AI_API_KEY` is not provided, the system gracefully falls back to rule-based logic.

---

## 🛠 Setup & Installation

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 🔐 Security Notes

- Row Level Security (RLS) is enabled on all Supabase tables
- Public read access for apprenticeship roles
- User profiles require authentication (or specific user_id match)
- For production, implement proper authentication with Supabase Auth

## 📝 Next Steps

To enhance the system:
1. Add authentication with Supabase Auth
2. Implement real-time updates with Supabase Realtime
3. Add email notifications for new matches
4. Integrate actual web scraping (using background jobs)
5. Add application tracking features
6. Implement advanced filtering and search

## 🐛 Troubleshooting

### Dashboard shows "No roles found"
- Ensure Supabase is configured correctly
- Run the migration script to populate data
- Check browser console for API errors

### API returns 500 errors
- Verify environment variables are set
- Check Supabase connection
- Review server logs in terminal

### AI features not working
- Ensure `GOOGLE_GENERATIVE_AI_API_KEY` is configured
- System will fallback to rule-based logic if AI fails

---

**Tech Stack**: Next.js 16.1.1, React, TypeScript, Tailwind CSS, Supabase, Vercel AI SDK, Google Gemini  
**Repository**: https://github.com/jeffjeff134-commits/Apprenticesearch.git
