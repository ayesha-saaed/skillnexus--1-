-- Create user_skills table for SkillNexus
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ayakqyxbfcqwatkzmfbo/sql

-- Enable RLS extension if needed
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";

-- Table
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL,
  proficiency TEXT CHECK (proficiency IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Beginner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (users manage own skills)
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY \"Users can view own skills\" ON public.user_skills FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY \"Users can insert own skills\" ON public.user_skills FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY \"Users can update own skills\" ON public.user_skills FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY \"Users can delete own skills\" ON public.user_skills FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_name ON public.user_skills(skill_name);

-- Verify
SELECT * FROM public.user_skills LIMIT 5;

