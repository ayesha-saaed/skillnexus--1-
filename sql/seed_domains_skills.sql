-- sql-dialect=postgres
-- Seed sample domains, skills, and learning resources
-- Run this in Supabase SQL Editor

-- 1. Insert sample domains
INSERT INTO public.domains (id, name, description, icon, color) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Web Development', 'Frontend and backend web development technologies', 'code', '#3b82f6'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Data Science', 'Data analysis, machine learning, and AI', 'brain', '#8b5cf6'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Cloud Computing', 'AWS, Azure, GCP and cloud architecture', 'cloud', '#10b981'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Mobile Development', 'iOS, Android, React Native development', 'smartphone', '#f59e0b'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'DevOps', 'CI/CD, Docker, Kubernetes, and automation', 'settings', '#ef4444')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert sample skills
INSERT INTO public.skills (id, name, description, domain_id) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'JavaScript', 'Core JavaScript programming language', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'React', 'React.js frontend library', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'TypeScript', 'Type-safe JavaScript', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Node.js', 'Server-side JavaScript runtime', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Python', 'Python programming language', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Machine Learning', 'ML algorithms and frameworks', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'AWS', 'Amazon Web Services', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Docker', 'Containerization platform', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'Kubernetes', 'Container orchestration', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a1a', 'React Native', 'Cross-platform mobile development', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert sample learning resources
INSERT INTO public.resources (title, description, url, type, skills_covered, difficulty, domain) VALUES
  ('JavaScript Fundamentals', 'Learn the basics of JavaScript programming', 'https://www.javascript.com/', ARRAY['JavaScript'], 'Beginner', 'Web Development'),
  ('React - The Complete Guide', 'Master React.js from scratch', 'https://reactjs.org/', ARRAY['React', 'JavaScript'], 'Intermediate', 'Web Development'),
  ('TypeScript Handbook', 'Official TypeScript documentation', 'https://www.typescriptlang.org/docs/', ARRAY['TypeScript', 'JavaScript'], 'Beginner', 'Web Development'),
  ('Node.js Documentation', 'Official Node.js docs', 'https://nodejs.org/docs/', ARRAY['Node.js', 'JavaScript'], 'Intermediate', 'Web Development'),
  ('Python for Data Science', 'Python data analysis tutorials', 'https://www.python.org/', ARRAY['Python'], 'Beginner', 'Data Science'),
  ('Machine Learning by Andrew Ng', 'Coursera ML course', 'https://www.coursera.org/learn/machine-learning', ARRAY['Machine Learning', 'Python'], 'Intermediate', 'Data Science'),
  ('AWS Fundamentals', 'Amazon Web Services getting started', 'https://aws.amazon.com/getting-started/', ARRAY['AWS'], 'Beginner', 'Cloud Computing'),
  ('Docker getting started', 'Learn Docker containers', 'https://docs.docker.com/get-started/', ARRAY['Docker'], 'Beginner', 'DevOps'),
  ('Kubernetes documentation', 'Official K8s docs', 'https://kubernetes.io/docs/', ARRAY['Kubernetes', 'Docker'], 'Advanced', 'DevOps'),
  ('React Native Expo', 'Build mobile apps with React Native', 'https://reactnative.dev/', ARRAY['React Native', 'React'], 'Intermediate', 'Mobile Development')
ON CONFLICT (url) DO NOTHING;

-- Verify data
SELECT 'Domains: ' || COUNT(*) FROM public.domains;
SELECT 'Skills: ' || COUNT(*) FROM public.skills;
SELECT 'Resources: ' || COUNT(*) FROM public.resources;

-- Show all domains
SELECT * FROM public.domains ORDER BY name;

-- Show all skills with domain
SELECT s.name as skill, d.name as domain
FROM public.skills s
LEFT JOIN public.domains d ON s.domain_id = d.id
ORDER BY d.name, s.name;
