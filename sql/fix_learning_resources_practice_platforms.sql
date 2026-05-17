-- sql-dialect=postgres
-- Remove Documentation + low-quality seeded rows; insert curated practice platforms.
-- Safe to re-run (uses stable URLs).

DELETE FROM public.resources WHERE type = 'Documentation';

DELETE FROM public.resources
WHERE type = 'Practice Platform'
  AND (
    title LIKE '% — Practice & Exercises%'
    OR title LIKE '% — Official Documentation%'
    OR url LIKE '%freecodecamp.org/news/search%'
    OR url LIKE '%developer.mozilla.org%search%'
  );

INSERT INTO public.resources (title, description, url, type, skills_covered, difficulty, domain, platform)
VALUES
  (
    'LeetCode',
    'Interview-style coding challenges, contests, and company-specific problem sets.',
    'https://leetcode.com/',
    'Practice Platform',
    ARRAY['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Data Structures', 'Algorithms', 'SQL', 'System Design'],
    'Intermediate',
    'General',
    'LeetCode'
  ),
  (
    'CodeChef',
    'Competitive programming practice, long challenges, and learning paths.',
    'https://www.codechef.com/',
    'Practice Platform',
    ARRAY['Python', 'Java', 'C++', 'Algorithms', 'Data Structures', 'Competitive Programming'],
    'Intermediate',
    'General',
    'CodeChef'
  ),
  (
    'HackerRank',
    'Skill tracks, certifications, and hands-on coding exercises by technology.',
    'https://www.hackerrank.com/',
    'Practice Platform',
    ARRAY['JavaScript', 'Python', 'Java', 'SQL', 'React', 'Node.js', 'Problem Solving', 'Data Structures'],
    'Beginner',
    'General',
    'HackerRank'
  ),
  (
    'Exercism',
    'Mentored coding exercises across many languages with a focus on fundamentals.',
    'https://exercism.org/',
    'Practice Platform',
    ARRAY['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'Elixir', 'Programming Fundamentals'],
    'Beginner',
    'General',
    'Exercism'
  ),
  (
    'Codewars',
    'Kata-style challenges ranked by difficulty with community solutions.',
    'https://www.codewars.com/',
    'Practice Platform',
    ARRAY['JavaScript', 'Python', 'TypeScript', 'Ruby', 'Java', 'Algorithms', 'Problem Solving'],
    'Intermediate',
    'General',
    'Codewars'
  ),
  (
    'CodeCrafters',
    'Build real-world tools (Git, Redis, Docker, SQLite) step by step in your language.',
    'https://codecrafters.io/',
    'Practice Platform',
    ARRAY['Python', 'Go', 'Rust', 'Git', 'Redis', 'Docker', 'Networking', 'Backend'],
    'Advanced',
    'Backend',
    'CodeCrafters'
  ),
  (
    'Edabit',
    'Short, game-like coding challenges ideal for building daily practice habits.',
    'https://edabit.com/',
    'Practice Platform',
    ARRAY['JavaScript', 'Python', 'Java', 'C#', 'Problem Solving', 'Programming Fundamentals'],
    'Beginner',
    'General',
    'Edabit'
  ),
  (
    'Codecademy',
    'Interactive lessons and projects across web, data, and computer science tracks.',
    'https://www.codecademy.com/',
    'Practice Platform',
    ARRAY['JavaScript', 'Python', 'HTML', 'CSS', 'SQL', 'React', 'TypeScript', 'Data Science', 'Web Development'],
    'Beginner',
    'General',
    'Codecademy'
  ),
  (
    'Mimo',
    'Mobile-friendly bite-sized coding lessons and practice for web and Python.',
    'https://mimo.org/',
    'Practice Platform',
    ARRAY['JavaScript', 'Python', 'HTML', 'CSS', 'Web Development', 'Programming Fundamentals'],
    'Beginner',
    'General',
    'Mimo'
  )
ON CONFLICT (url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  skills_covered = EXCLUDED.skills_covered,
  difficulty = EXCLUDED.difficulty,
  domain = EXCLUDED.domain,
  platform = EXCLUDED.platform;
