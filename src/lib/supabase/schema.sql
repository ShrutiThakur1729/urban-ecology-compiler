-- URBAN ECOLOGY COMPILER DATABASE SCHEMA
-- Supabase / PostgreSQL Schema with Row Level Security (RLS)

-- 1. Users Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  center_lng DOUBLE PRECISION NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sites Table (Drawn / Selected Polygons)
CREATE TABLE IF NOT EXISTS public.sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  polygon_geojson JSONB NOT NULL,
  area_sq_meters DOUBLE PRECISION NOT NULL,
  area_hectares DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Site Analyses Table (Raw provider signals & derived metrics)
CREATE TABLE IF NOT EXISTS public.site_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  analysis_json JSONB NOT NULL,
  green_coverage_percent NUMERIC,
  built_up_percent NUMERIC,
  runoff_vulnerability_score INTEGER,
  heat_vulnerability_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Interventions Library Table
CREATE TABLE IF NOT EXISTS public.interventions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_cost_inr NUMERIC NOT NULL,
  cost_unit TEXT NOT NULL,
  spec_json JSONB NOT NULL
);

-- 6. Scenarios Table (Compiled & Optimized plans)
CREATE TABLE IF NOT EXISTS public.scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  scenario_type TEXT NOT NULL, -- 'BALANCED', 'FLOOD_FIRST', 'BIODIVERSITY_FIRST'
  title TEXT NOT NULL,
  natural_language_prompt TEXT,
  budget_inr NUMERIC NOT NULL,
  total_cost_inr NUMERIC NOT NULL,
  impact_summary_json JSONB NOT NULL,
  interventions_geojson JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for spatial and relational performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_project_id ON public.sites(project_id);
CREATE INDEX IF NOT EXISTS idx_analyses_site_id ON public.site_analyses(site_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_site_id ON public.scenarios(site_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
