-- sql-dialect=postgres
-- Run in Supabase SQL Editor (entire file). Safe to re-run.
-- Fixes: relation "public.skill_development_events" does not exist (42P01)

-- ---------------------------------------------------------------------------
-- 0. Optional table used by My Skills timeline (create if your project lacks it)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- ---------------------------------------------------------------------------
-- 1. Admin read/write on learner user_skills (admin dashboard User details)
--    Requires: public.user_skills + public.profiles with role = 'admin'
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "user_skills admin read" ON public.user_skills;
CREATE POLICY "user_skills admin read" ON public.user_skills
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "skill_development_events admin read" ON public.skill_development_events;
CREATE POLICY "skill_development_events admin read" ON public.skill_development_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "user_skills admin insert" ON public.user_skills;
CREATE POLICY "user_skills admin insert" ON public.user_skills
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "user_skills admin update" ON public.user_skills;
CREATE POLICY "user_skills admin update" ON public.user_skills
FOR UPDATE USING (
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

DROP POLICY IF EXISTS "user_skills admin delete" ON public.user_skills;
CREATE POLICY "user_skills admin delete" ON public.user_skills
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
