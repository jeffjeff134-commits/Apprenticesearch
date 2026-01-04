-- Apprenticeship Roles Table
CREATE TABLE apprenticeship_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  application_deadline TEXT NOT NULL,
  start_date TEXT NOT NULL,
  salary TEXT NOT NULL,
  location TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  qc_validation_status TEXT DEFAULT 'PENDING',
  qc_validation_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Attributes Table
CREATE TABLE role_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES apprenticeship_roles(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'Inferred',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, attribute_name)
);

-- User Profiles Table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  education TEXT,
  interests JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  location_preference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_apprenticeship_roles_deadline ON apprenticeship_roles(application_deadline);
CREATE INDEX idx_apprenticeship_roles_location ON apprenticeship_roles(location);
CREATE INDEX idx_role_attributes_role_id ON role_attributes(role_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE apprenticeship_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access for apprenticeship roles
CREATE POLICY "Allow public read access" ON apprenticeship_roles
  FOR SELECT USING (true);

-- Public read access for role attributes
CREATE POLICY "Allow public read access" ON role_attributes
  FOR SELECT USING (true);

-- Users can only read their own profiles
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = user_id OR user_id IS NOT NULL);
