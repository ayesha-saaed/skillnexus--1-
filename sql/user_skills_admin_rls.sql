-- Run in Supabase SQL Editor: allow admins to read all learner user_skills and
-- related skill events so the admin dashboard matches the main app.
-- (Users still have owner policies; RLS OR-combines policies for SELECT.)

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

-- Admins: insert/update/delete any learner row (user details panel in admin dashboard).
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
