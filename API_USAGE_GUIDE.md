# API Usage Guide

## Your Supabase Schema

### jobs table
- `id` (uuid, primary key)
- `created_at` (timestamptz)
- `title` (text) - Job title
- `company` (text) - Company name
- `location` (text) - Location
- `salary` (text) - Salary information
- `attributes` (jsonb) - Soft skills/candidate attributes
- `url` (text) - Application URL

### profiles table
- `id` (uuid, primary key)
- `updated_at` (timestamptz)
- `first_name` (text) - User's first name
- `predicted_grades` (text) - Expected grades
- `interests` (jsonb) - Array of interests
- `vibe_summary` (text) - AI-generated career summary

---

## API Endpoints

### 1. Scout Agent - `/api/scout`

#### Add a Single Job
```bash
curl -X POST http://localhost:3000/api/scout \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Software Developer Apprentice",
    "company": "Tech Corp",
    "location": "London",
    "salary": "£22,000 per year",
    "url": "https://example.com/job/123"
  }'
```

#### Add Multiple Jobs (Bulk)
```bash
curl -X POST http://localhost:3000/api/scout \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      {
        "title": "Data Analyst Apprentice",
        "company": "Finance Ltd",
        "location": "Manchester",
        "salary": "£20,000",
        "url": "https://example.com/job/124"
      },
      {
        "title": "Digital Marketing Apprentice",
        "company": "Marketing Co",
        "location": "Birmingham",
        "salary": "£18,500",
        "url": "https://example.com/job/125"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "inserted": 1,
  "failed": 0,
  "results": [
    {
      "id": "uuid-here",
      "url": "https://example.com/job/123",
      "attributes_inferred": 3
    }
  ]
}
```

The Scout automatically infers attributes based on the title and company:
- **"Software Developer"** → ["Logical Reasoning", "Computational Thinking", "Agile Mindset"]
- **"Accountant"** → ["Numerical Literacy", "Professional Integrity", "Stakeholder Management"]
- **"Project Manager"** → ["Time Management", "Conflict Resolution", "Commercial Awareness"]

#### Get Scout Statistics
```bash
curl http://localhost:3000/api/scout/stats
```

---

### 2. Vibe-Check Agent - `/api/vibe-check`

#### Create a Profile
```bash
curl -X POST http://localhost:3000/api/vibe-check \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Alice",
    "predicted_grades": "AAB",
    "interests": ["Software Engineering", "AI", "Data Science"]
  }'
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "uuid-here",
    "first_name": "Alice",
    "predicted_grades": "AAB",
    "interests": ["Software Engineering", "AI", "Data Science"],
    "vibe_summary": "Based on your interests in Software Engineering, AI, Data Science, you show strong alignment with Software Development. Your technical interests suggest excellent potential for tech apprenticeships.",
    "updated_at": "2026-01-04T08:30:00Z"
  }
}
```

The vibe_summary is automatically generated using AI (if Google Gemini configured) or a simple text template.

#### Update a Profile
```bash
curl -X POST http://localhost:3000/api/vibe-check \
  -H "Content-Type: application/json" \
  -d '{
    "id": "existing-uuid",
    "first_name": "Alice",
    "predicted_grades": "AAA",
    "interests": ["Software Engineering", "AI", "Data Science", "Cybersecurity"],
    "vibe_summary": "Custom summary text"
  }'
```

#### Get a Profile by ID
```bash
curl "http://localhost:3000/api/vibe-check?id=uuid-here"
```

#### Get a Profile by First Name
```bash
curl "http://localhost:3000/api/vibe-check?first_name=Alice"
```

#### Get All Profiles
```bash
curl http://localhost:3000/api/vibe-check
```

---

### 3. Roles API - `/api/roles`

#### Get All Roles
```bash
curl http://localhost:3000/api/roles
```

#### Filter by Location
```bash
curl "http://localhost:3000/api/roles?location=London"
```

#### Search by Title or Company
```bash
curl "http://localhost:3000/api/roles?search=software"
```

#### Pagination
```bash
curl "http://localhost:3000/api/roles?limit=10&offset=0"
```

#### Combined Filters
```bash
curl "http://localhost:3000/api/roles?location=London&search=developer&limit=20"
```

**Response:**
```json
{
  "roles": [
    {
      "id": "uuid",
      "title": "Software Developer Apprentice",
      "company": "Tech Corp",
      "location": "London",
      "salary": "£22,000",
      "url": "https://example.com/job/123",
      "skills": ["Logical Reasoning", "Computational Thinking", "Agile Mindset"],
      "attributes": [
        {"name": "Logical Reasoning", "source": "Inferred"},
        {"name": "Computational Thinking", "source": "Inferred"},
        {"name": "Agile Mindset", "source": "Inferred"}
      ],
      "created_at": "2026-01-04T08:00:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

## Attribute Inference Rules

The Scout automatically categorizes jobs and assigns attributes:

| Category | Keywords | Attributes |
|----------|----------|------------|
| **Digital/Software** | digital, software, technology, developer, data, ai, cyber, it, computing, network, cloud | Logical Reasoning, Computational Thinking, Agile Mindset |
| **Engineering/Manufacturing** | engineer, engineering, manufacturing, surveyor, technician, construction, electrician, mechanic, civil | Manual Dexterity, Health & Safety Awareness, Systems Thinking |
| **Audit/Finance** | accountancy, accounting, accountant, audit, finance, bookkeeper, claims, underwriting, payroll, tax, actuarial | Numerical Literacy, Professional Integrity, Stakeholder Management |
| **Business/Project Management** | management, manager, project, business, sales, executive, admin, operations, hr, human resources, marketing | Time Management, Conflict Resolution, Commercial Awareness |

---

## Testing with cURL

### Full Workflow Example

1. **Add some jobs:**
```bash
curl -X POST http://localhost:3000/api/scout \
  -H "Content-Type: application/json" \
  -d '{"title": "Software Developer", "company": "TechCo", "location": "London", "salary": "£25k", "url": "https://example.com/1"}'
```

2. **Create a profile:**
```bash
curl -X POST http://localhost:3000/api/vibe-check \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Bob", "predicted_grades": "AAB", "interests": ["Software", "Gaming"]}'
```

3. **View all roles:**
```bash
curl http://localhost:3000/api/roles
```

4. **Check stats:**
```bash
curl http://localhost:3000/api/scout/stats
```

---

## Frontend Integration

The dashboard at http://localhost:3000 automatically:
- Fetches all roles from `/api/roles`
- Displays the first profile from `/api/vibe-check`
- Shows jobs in a responsive grid
- Extracts skills from the `attributes` JSONB field

---

## Notes

- All JSONB fields (`attributes`, `interests`) are automatically handled by the API
- The Scout infers attributes automatically - you don't need to provide them
- The Vibe-Check can generate summaries using AI if `GOOGLE_GENERATIVE_AI_API_KEY` is configured
- All endpoints include proper error handling and validation
