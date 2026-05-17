-- sql-dialect=postgres
-- One-time fix: remove fake skillnexus.dev resource links (Cloudflare 1033 errors).
-- Then run: sql/seed_learning_resources_by_skill.sql

DELETE FROM public.resources
WHERE url LIKE 'https://skillnexus.dev/learn/%'
   OR url LIKE 'http://skillnexus.dev/learn/%';

SELECT COUNT(*) AS resources_remaining FROM public.resources;
