-- sql-dialect=postgres
-- RUN THIS ENTIRE FILE in Supabase SQL Editor (fixes admin seeing only self + resource writes).
-- Safe to re-run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Avoid infinite recursion: policies must NOT query profiles directly; use SECURITY DEFINER helper.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- Profile columns for User Details
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_job_role_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_job_role_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_path_domain TEXT;

-- ---------- PROFILES: owner + admin (replace broken recursive policies) ----------
DROP POLICY IF EXISTS "profiles owner read/write" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin full" ON public.profiles;

CREATE POLICY "profiles select own or admin" ON public.profiles
FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles insert own" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles update own or admin" ON public.profiles
FOR UPDATE
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles delete admin" ON public.profiles
FOR DELETE USING (public.is_admin());

-- ---------- RESOURCES: public read + admin write ----------
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resources readable" ON public.resources;
DROP POLICY IF EXISTS "resources admin full" ON public.resources;
DROP POLICY IF EXISTS "resources admin insert" ON public.resources;
DROP POLICY IF EXISTS "resources admin update" ON public.resources;
DROP POLICY IF EXISTS "resources admin delete" ON public.resources;

CREATE POLICY "resources public read" ON public.resources
FOR SELECT USING (true);

CREATE POLICY "resources admin insert" ON public.resources
FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "resources admin update" ON public.resources
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "resources admin delete" ON public.resources
FOR DELETE USING (public.is_admin());

-- ---------- skill_development_events + user_skills (from user_skills_admin_rls.sql) ----------
CREATE TABLE IF NOT EXISTS public.skill_development_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('added', 'updated', 'deleted')),
  detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.skill_development_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skill events owner read/write" ON public.skill_development_events;
CREATE POLICY "skill events owner read/write" ON public.skill_development_events
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_skills admin read" ON public.user_skills;
CREATE POLICY "user_skills admin read" ON public.user_skills
FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "skill_development_events admin read" ON public.skill_development_events;
CREATE POLICY "skill_development_events admin read" ON public.skill_development_events
FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "user_skills admin insert" ON public.user_skills;
CREATE POLICY "user_skills admin insert" ON public.user_skills
FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "user_skills admin update" ON public.user_skills;
CREATE POLICY "user_skills admin update" ON public.user_skills
FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "user_skills admin delete" ON public.user_skills;
CREATE POLICY "user_skills admin delete" ON public.user_skills
FOR DELETE USING (public.is_admin());

-- Grant admin to your Supabase login (edit email, run once):
UPDATE public.profiles SET role = 'admin' WHERE email ILIKE 'ayeshrao2004@gmail.com';
