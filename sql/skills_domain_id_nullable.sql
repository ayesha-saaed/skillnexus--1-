-- If inserts fail with NOT NULL on skills.domain_id, run once in Supabase SQL:
ALTER TABLE public.skills
  ALTER COLUMN domain_id DROP NOT NULL;
