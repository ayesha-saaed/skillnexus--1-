-- sql-dialect=postgres
-- Full admin user-management bundle. Run entire file in Supabase SQL Editor (safe to re-run).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profile columns used by User Details (Gap Checker / active path)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_job_role_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_job_role_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_path_domain TEXT;

-- Admins: list / edit / delete all profiles (required for "display all users")
DROP POLICY IF EXISTS "profiles admin full" ON public.profiles;
CREATE POLICY "profiles admin full" ON public.profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Skill development timeline (My Skills)
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

-- Admin policies on user_skills
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

-- Optional: enable Realtime in Dashboard → Database → Replication for:
--   public.profiles, public.user_skills
