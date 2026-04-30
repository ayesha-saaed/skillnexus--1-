-- Run in Supabase → SQL. Fixes "Save" on Admin → Domains when the table
-- came from an older editor bundle, or RLS blocks inserts.
-- Idempotent: safe to run more than once.

-- 1) Let inserts work without a client id (if id had no default)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'domains' AND column_name = 'id'
  ) THEN
    BEGIN
      ALTER TABLE public.domains
        ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION WHEN OTHERS THEN
      -- ignore if already has default or not applicable
      NULL;
    END;
  END IF;
END $$;

-- 2) Columns the admin panel expects
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3) RLS: public can read, admins can write
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Domains public read" ON public.domains;
DROP POLICY IF EXISTS "domains public read" ON public.domains;
CREATE POLICY "Domains public read" ON public.domains
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Domains admin full" ON public.domains;
DROP POLICY IF EXISTS "Domains admin full_insert" ON public.domains;
DROP POLICY IF EXISTS "Domains admin full_update" ON public.domains;
DROP POLICY IF EXISTS "Domains admin full_delete" ON public.domains;

-- Split policies so INSERT works for anon-key + authenticated admin
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
