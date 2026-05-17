-- sql-dialect=postgres
-- Seed learning resources for every row in public.skills (5 types per skill).
-- Run after sql/seed_domains_skills.sql. Safe to re-run (unique URLs per skill + type).

INSERT INTO public.resources (title, description, url, type, skills_covered, difficulty, domain)
SELECT
  s.name || ' — Official Documentation',
  'Documentation and reference material for ' || s.name || '.',
  'https://skillnexus.dev/learn/' || s.id::text || '/documentation',
  'Documentation',
  ARRAY[s.name],
  'Beginner',
  COALESCE(d.name, 'General')
FROM public.skills s
LEFT JOIN public.domains d ON d.id = s.domain_id

UNION ALL

SELECT
  s.name || ' — Structured Course',
  'In-depth course covering fundamentals and practice for ' || s.name || '.',
  'https://skillnexus.dev/learn/' || s.id::text || '/course',
  'Course',
  ARRAY[s.name],
  'Intermediate',
  COALESCE(d.name, 'General')
FROM public.skills s
LEFT JOIN public.domains d ON d.id = s.domain_id

UNION ALL

SELECT
  s.name || ' — Video Tutorials',
  'Video walkthroughs and demos for ' || s.name || '.',
  'https://skillnexus.dev/learn/' || s.id::text || '/video',
  'Video',
  ARRAY[s.name],
  'Beginner',
  COALESCE(d.name, 'General')
FROM public.skills s
LEFT JOIN public.domains d ON d.id = s.domain_id

UNION ALL

SELECT
  s.name || ' — Articles & Guides',
  'Articles, blog posts, and guides about ' || s.name || '.',
  'https://skillnexus.dev/learn/' || s.id::text || '/article',
  'Article',
  ARRAY[s.name],
  'Intermediate',
  COALESCE(d.name, 'General')
FROM public.skills s
LEFT JOIN public.domains d ON d.id = s.domain_id

UNION ALL

SELECT
  s.name || ' — Practice Platform',
  'Hands-on exercises and challenges for ' || s.name || '.',
  'https://skillnexus.dev/learn/' || s.id::text || '/practice',
  'Practice Platform',
  ARRAY[s.name],
  'Advanced',
  COALESCE(d.name, 'General')
FROM public.skills s
LEFT JOIN public.domains d ON d.id = s.domain_id

ON CONFLICT (url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  skills_covered = EXCLUDED.skills_covered,
  difficulty = EXCLUDED.difficulty,
  domain = EXCLUDED.domain;

SELECT COUNT(*) AS total_resources FROM public.resources;
SELECT s.name AS skill, COUNT(r.id) AS resource_count
FROM public.skills s
LEFT JOIN public.resources r ON s.name = ANY (r.skills_covered)
GROUP BY s.name
ORDER BY s.name;
