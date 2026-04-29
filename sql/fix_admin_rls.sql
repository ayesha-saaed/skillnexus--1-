-- sql-dialect=postgres
-- Fix Admin RLS Policies for Insert/Update Operations
-- Run this in Supabase SQL Editor

-- 1. Drop existing restrictive policies and recreate with proper INSERT handling

-- Domains: Allow full access for authenticated admin users
DROP POLICY IF EXISTS "Domains admin full" ON public.domains;
CREATE POLICY "Domains admin full_insert" ON public.domains FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Domains admin full_update" ON public.domains FOR UPDATE
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

CREATE POLICY "Domains admin full_delete" ON public.domains FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Skills: Allow full access for authenticated admin users  
DROP POLICY IF EXISTS "Skills admin full access" ON public.skills;
CREATE POLICY "Skills admin insert" ON public.skills FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Skills admin update" ON public.skills FOR UPDATE
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

CREATE POLICY "Skills admin delete" ON public.skills FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Resources: Allow full access for authenticated admin users
DROP POLICY IF EXISTS "resources admin full" ON public.resources;
CREATE POLICY "resources admin insert" ON public.resources FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "resources admin update" ON public.resources FOR UPDATE
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

CREATE POLICY "resources admin delete" ON public.resources FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 2. Grant service_role bypass for all operations (for direct SQL inserts)
-- This is handled automatically by Supabase

-- 3. Verify the policies are set up correctly
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('domains', 'skills', 'resources')
ORDER BY tablename, cmd;
