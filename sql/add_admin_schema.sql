-- sql-dialect=postgres
-- Add Admin Dashboard Schema
-- Run in Supabase SQL Editor

-- 1. Create skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- RLS for skills (admin full access + public read)
CREATE POLICY "Skills public read" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Skills admin full access" ON public.skills FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 2. Add skill_ids to resources
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS skill_ids UUID[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_resources_skill_ids ON public.resources USING GIN (skill_ids);

-- 3. Admin policies for existing tables
-- Profiles (admin view all, edit roles)
DROP POLICY IF EXISTS "profiles admin full" ON public.profiles;
CREATE POLICY "profiles admin full" ON public.profiles FOR ALL 
USING (
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Domains admin full
DROP POLICY IF EXISTS "domains admin full" ON public.domains;
CREATE POLICY "domains admin full" ON public.domains FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Resources admin full (keep public read)
CREATE POLICY "resources admin full" ON public.resources FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 4. Create domains table if not exists
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Domains public read
CREATE POLICY "Domains public read" ON public.domains FOR SELECT USING (true);

-- Domains admin full
CREATE POLICY "Domains admin full" ON public.domains FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs admin read" ON public.audit_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 6. Create admin activity view
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.domains) as total_domains,
  (SELECT COUNT(*) FROM public.skills) as total_skills,
  (SELECT COUNT(*) FROM public.resources) as total_resources,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as total_admins;
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 4. Seed skills from knowledge_base (run once)
INSERT INTO public.skills (name, description, domain_id)
SELECT 
  ms.name,
  ms.description,
  d.id
FROM (VALUES 
  ('JavaScript', 'Frontend Language', '00000000-0000-0000-0000-000000000001'),
  ('React', 'UI Library', '00000000-0000-0000-0000-000000000001'),
  ('Node.js', 'Backend Runtime', '00000000-0000-0000-0000-000000000002'),
  ('Python', 'General Purpose', '00000000-0000-0000-0000-000000000003'),
  ('Docker', 'Containerization', '00000000-0000-0000-0000-000000000002')
) AS ms(name, description, domain_id_str)
JOIN public.domains d ON d.id::text = domain_id_str
ON CONFLICT (name) DO NOTHING;

-- Verify
SELECT 'Skills created: ' || COUNT(*) FROM public.skills;
SELECT * FROM public.skills LIMIT 5;

