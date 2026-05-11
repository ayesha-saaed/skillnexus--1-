-- Migration: Add soft-delete and quality metadata fields for admin-managed resources
-- Run in Supabase SQL editor or your migration workflow.

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS quality_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freshness_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_by uuid DEFAULT NULL;

ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid DEFAULT NULL;

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid DEFAULT NULL;

ALTER TABLE public.progress
  ADD COLUMN IF NOT EXISTS last_accessed timestamptz DEFAULT NULL;
