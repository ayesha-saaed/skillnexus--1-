-- =============================================================================
-- Supabase → SQL Editor: paste this entire file and click RUN once.
-- Domains + Curated skills (admin panel). Idempotent: safe to re-run.
-- Requires: public.profiles with role = 'admin' for your admin user.
-- =============================================================================

-- Extensions (Supabase usually has this; no-op if already on)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1) DOMAINS (create first — skills FK references this)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- If an old table was missing a default on id, set it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'domains' AND column_name = 'id'
  ) THEN
    BEGIN
      ALTER TABLE public.domains ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- Columns the admin UI expects (safe if from editor bundle)
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- =============================================================================
-- 2) SKILLS (curated catalog; domain optional in app = nullable domain_id)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- "Unassigned" in admin = NULL domain_id
ALTER TABLE public.skills ALTER COLUMN domain_id DROP NOT NULL;

-- =============================================================================
-- 3) RESOURCES: link to skill UUIDs (only if table exists)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'resources'
  ) THEN
    ALTER TABLE public.resources
      ADD COLUMN IF NOT EXISTS skill_ids UUID[] DEFAULT '{}';
    CREATE INDEX IF NOT EXISTS idx_resources_skill_ids
      ON public.resources USING GIN (skill_ids);
  END IF;
END $$;

-- =============================================================================
-- 4) RLS — DOMAINS (everyone read; admins write)
-- =============================================================================
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Domains public read" ON public.domains;
DROP POLICY IF EXISTS "domains public read" ON public.domains;
DROP POLICY IF EXISTS "Domains admin full" ON public.domains;
DROP POLICY IF EXISTS "domains admin full" ON public.domains;
DROP POLICY IF EXISTS "Domains admin full_insert" ON public.domains;
DROP POLICY IF EXISTS "Domains admin full_update" ON public.domains;
DROP POLICY IF EXISTS "Domains admin full_delete" ON public.domains;
DROP POLICY IF EXISTS "Domains admin insert" ON public.domains;
DROP POLICY IF EXISTS "Domains admin update" ON public.domains;
DROP POLICY IF EXISTS "Domains admin delete" ON public.domains;

CREATE POLICY "Domains public read" ON public.domains
FOR SELECT USING (true);

CREATE POLICY "Domains admin insert" ON public.domains
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Domains admin update" ON public.domains
FOR UPDATE USING (
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

CREATE POLICY "Domains admin delete" ON public.domains
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- =============================================================================
-- 5) RLS — SKILLS (everyone read; admins write)
-- =============================================================================
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Skills public read" ON public.skills;
DROP POLICY IF EXISTS "Skills admin full access" ON public.skills;
DROP POLICY IF EXISTS "Skills admin insert" ON public.skills;
DROP POLICY IF EXISTS "Skills admin update" ON public.skills;
DROP POLICY IF EXISTS "Skills admin delete" ON public.skills;

CREATE POLICY "Skills public read" ON public.skills
FOR SELECT USING (true);

CREATE POLICY "Skills admin insert" ON public.skills
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Skills admin update" ON public.skills
FOR UPDATE USING (
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

CREATE POLICY "Skills admin delete" ON public.skills
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Done
SELECT 'domains' AS tbl, count(*)::text AS rows FROM public.domains
UNION ALL
SELECT 'skills', count(*)::text FROM public.skills;
