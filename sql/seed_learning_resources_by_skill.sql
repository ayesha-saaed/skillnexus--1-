-- sql-dialect=postgres
-- Seed learning resources for every row in public.skills (4 types per skill — no Documentation).
-- Uses real external URLs (Coursera, YouTube, Google search, articles).
-- Practice platforms: run sql/fix_learning_resources_practice_platforms.sql (9 curated sites).
-- Run after sql/seed_domains_skills.sql. Safe to re-run.

DELETE FROM public.resources
WHERE url LIKE 'https://skillnexus.dev/learn/%';

DELETE FROM public.resources WHERE type = 'Documentation';

INSERT INTO public.resources (title, description, url, type, skills_covered, difficulty, domain, platform)
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

ON CONFLICT (url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  skills_covered = EXCLUDED.skills_covered,
  difficulty = EXCLUDED.difficulty,
  domain = EXCLUDED.domain,
  platform = EXCLUDED.platform;

SELECT COUNT(*) AS total_resources FROM public.resources;
SELECT type, COUNT(*) AS n FROM public.resources GROUP BY type ORDER BY type;
