-- sql-dialect=postgres
-- Seed sample learning resources aligned to domains + job-role skills.
-- Run after domains/job_roles exist. Uses ON CONFLICT (url) so safe to re-run.

INSERT INTO public.resources (title, description, url, type, skills_covered, difficulty, domain, platform, duration, rating)
VALUES
  ('React Fundamentals', 'Learn modern React from scratch.', 'https://react.dev/learn', 'Course', ARRAY['React', 'JavaScript'], 'Beginner', 'Web Development', 'React', '15 hours', 4.9),
  ('Advanced React Patterns', 'Hooks, context, and performance.', 'https://react.dev/reference/react', 'Course', ARRAY['React'], 'Advanced', 'Web Development', 'React', '12 hours', 4.8),
  ('Node.js Backend Basics', 'Build APIs with Node and Express.', 'https://nodejs.org/en/learn', 'Course', ARRAY['Node.js', 'JavaScript'], 'Intermediate', 'Web Development', 'Node.js', '18 hours', 4.7),
  ('Python for Data Science', 'Pandas, NumPy, and visualization.', 'https://www.python.org/about/gettingstarted/', 'Course', ARRAY['Python', 'Pandas'], 'Beginner', 'Data Science', 'Python', '20 hours', 4.8),
  ('Machine Learning with Python', 'Supervised and unsupervised learning.', 'https://developers.google.com/machine-learning', 'Course', ARRAY['Machine Learning', 'Python'], 'Intermediate', 'Data Science', 'Google', '22 hours', 4.7),
  ('AWS Cloud Practitioner', 'Core AWS services and architecture.', 'https://aws.amazon.com/training/', 'Course', ARRAY['AWS', 'Cloud'], 'Beginner', 'Cloud/DevOps', 'AWS', '14 hours', 4.6),
  ('Docker & Kubernetes', 'Containerize and orchestrate apps.', 'https://kubernetes.io/docs/home/', 'Course', ARRAY['Docker', 'Kubernetes', 'DevOps'], 'Intermediate', 'Cloud/DevOps', 'CNCF', '16 hours', 4.7),
  ('UI/UX Design with Figma', 'Interface design fundamentals.', 'https://www.figma.com/resources/learn-design/', 'Course', ARRAY['Figma', 'UI Design'], 'Beginner', 'UI/UX Design', 'Figma', '10 hours', 4.8),
  ('Cybersecurity Essentials', 'Threat models and secure coding.', 'https://www.cisa.gov/cybersecurity', 'Course', ARRAY['Security', 'Networking'], 'Intermediate', 'Cybersecurity', 'CISA', '12 hours', 4.5),
  ('Full Stack Project Lab', 'End-to-end app with React and Node.', 'https://fullstackopen.com/en/', 'Course', ARRAY['React', 'Node.js', 'JavaScript', 'MongoDB'], 'Advanced', 'Full Stack', 'University of Helsinki', '25 hours', 4.9)
ON CONFLICT (url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  skills_covered = EXCLUDED.skills_covered,
  difficulty = EXCLUDED.difficulty,
  domain = EXCLUDED.domain,
  platform = EXCLUDED.platform,
  duration = EXCLUDED.duration,
  rating = EXCLUDED.rating;

-- Tip: job_roles.domain should match resources.domain (e.g. "Web Development") for links to appear in Admin → Roles.
