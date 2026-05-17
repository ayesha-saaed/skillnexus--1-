-- sql-dialect=postgres
-- Seed learning resources for every row in public.skills (5 types per skill).
-- Uses real external URLs (MDN, Coursera, YouTube, Google search, FreeCodeCamp).
-- Run after sql/seed_domains_skills.sql. Safe to re-run.

-- Remove old placeholder links that 404 / Cloudflare tunnel errors
DELETE FROM public.resources
WHERE url LIKE 'https://skillnexus.dev/learn/%';

INSERT INTO public.resources (title, description, url, type, skills_covered, difficulty, domain, platform)
SELECT
  s.name || ' — Official Documentation',
  'Documentation and reference material for ' || s.name || ' (MDN / official docs search).',
  'https://developer.mozilla.org/en-US/search?q=' || replace(trim(s.name), ' ', '+'),
  'Documentation',
  ARRAY[s.name],
  'Beginner',
  COALESCE(d.name, 'General'),
  'MDN'
FROM public.skills s
LEFT JOIN public.domains d ON d.id = s.domain_id

UNION ALL

SELECT
  s.name || ' — Coursera Courses',
  'Browse Coursera courses related to ' || s.name || '.',
  'https://www.coursera.org/search?query=' || replace(trim(s.name), ' ', '%20'),
  'Course',
  ARRAY[s.name],
  'Intermediate',
  COALESCE(d.name, 'General'),
  'Coursera'
FROM public.skills s
LEFT JOIN public.domains d ON d.id = s.domain_id

UNION ALL

SELECT
  s.name || ' — YouTube Tutorials',
  'Video tutorials and walkthroughs for ' || s.name || '.',
  'https://www.youtube.com/results?search_query=' || replace(trim(s.name), ' ', '+') || '+tutorial',
  'Video',
  ARRAY[s.name],
  'Beginner',
  COALESCE(d.name, 'General'),
  'YouTube'
FROM public.skills s
LEFT JOIN public.domains d ON d.id = s.domain_id

UNION ALL

SELECT
  s.name || ' — Articles & Guides',
  'Curated articles and guides about ' || s.name || ' (Google search).',
  'https://www.google.com/search?q=' || replace(trim(s.name), ' ', '+') || '+programming+tutorial',
  'Article',
  ARRAY[s.name],
  'Intermediate',
  COALESCE(d.name, 'General'),
  'Google'
FROM public.skills s
LEFT JOIN public.domains d ON d.id = s.domain_id

UNION ALL

SELECT
  s.name || ' — Practice & Exercises',
  'Hands-on practice and exercises for ' || s.name || '.',
  'https://www.freecodecamp.org/news/search/?query=' || replace(trim(s.name), ' ', '%20'),
  'Practice Platform',
  ARRAY[s.name],
  'Advanced',
  COALESCE(d.name, 'General'),
  'freeCodeCamp'
FROM public.skills s
LEFT JOIN public.domains d ON d.id = s.domain_id

ON CONFLICT (url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  skills_covered = EXCLUDED.skills_covered,
  difficulty = EXCLUDED.difficulty,
  domain = EXCLUDED.domain,
  platform = EXCLUDED.platform;

SELECT COUNT(*) AS total_resources FROM public.resources;
SELECT s.name AS skill, COUNT(r.id) AS resource_count
FROM public.skills s
LEFT JOIN public.resources r ON s.name = ANY (r.skills_covered)
GROUP BY s.name
ORDER BY s.name;
