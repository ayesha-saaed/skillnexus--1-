-- Paste this entire file into Supabase Dashboard → SQL Editor → Run.
-- Safe to run multiple times (idempotent patterns).

-- 1) Skill development tracking (learning / skill change history)
create table if not exists public.skill_development_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_name text not null,
  event_type text not null check (event_type in ('added', 'updated', 'deleted')),
  detail jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.skill_development_events enable row level security;

drop policy if exists "skill events owner read/write" on public.skill_development_events;
create policy "skill events owner read/write" on public.skill_development_events
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Global job roles catalog (gap analysis targets)
insert into public.job_roles (role_name, required_skills, domain, difficulty)
values
  (
    'Senior Frontend Engineer',
    array['React', 'TypeScript', 'Next.js', 'JavaScript', 'Tailwind CSS', 'Storybook']::text[],
    'Frontend',
    'Intermediate'
  ),
  (
    'Full Stack Developer',
    array['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Docker', 'JavaScript']::text[],
    'Full Stack',
    'Intermediate'
  ),
  (
    'AI Research Scientist',
    array['Python', 'PyTorch', 'NumPy', 'TensorFlow', 'Fine Tuning', 'LangChain']::text[],
    'AI',
    'Intermediate'
  )
on conflict (role_name) do update set
  required_skills = excluded.required_skills,
  domain = excluded.domain,
  difficulty = excluded.difficulty;

-- 3) Profile columns for active career path (selected job role)
alter table public.profiles add column if not exists active_job_role_id uuid;
alter table public.profiles add column if not exists active_job_role_name text;
alter table public.profiles add column if not exists active_path_domain text;

-- 4) Add DOMAINS table for SkillAnalysis (missing from schema)
CREATE TABLE IF NOT EXISTS public.domains (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  languages text[],
  frameworks text[],
  libraries text[],
  tools text[]
);
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "domains public read" ON public.domains;
CREATE POLICY "domains public read" ON public.domains FOR SELECT USING (true);

-- 5) SEED DOMAINS table with complete data (safe upsert)
INSERT INTO public.domains (id, name, languages, frameworks, libraries, tools) VALUES
('00000000-0000-0000-0000-000000000001', 'Frontend Development', ARRAY['HTML','CSS','JavaScript','TypeScript'], ARRAY['React','Next.js','Angular','Vue.js','Svelte'], ARRAY['Redux','Zustand','Axios','Framer Motion','Chart.js','Tailwind CSS'], ARRAY['Webpack','Vite','Babel','ESLint','Prettier','Figma']),
('00000000-0000-0000-0000-000000000002', 'Backend Development', ARRAY['JavaScript','Python','Java','Go','Rust','PHP','Ruby','C#'], ARRAY['Node.js','Express.js','Django','FastAPI','Spring Boot','Laravel','Ruby on Rails','NestJS'], ARRAY['Prisma','Sequelize','SQLAlchemy','Mongoose','JWT','bcrypt'], ARRAY['Postman','Docker','Redis','Nginx','PM2']),
('00000000-0000-0000-0000-000000000003', 'Full Stack Development', ARRAY['JavaScript','TypeScript','Python'], ARRAY['React','Next.js','Node.js','Express.js','NestJS'], ARRAY['Prisma','Mongoose','Redux','Axios','Socket.io'], ARRAY['Docker','Git','Vercel','Supabase','PostgreSQL','MongoDB'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, languages = EXCLUDED.languages, frameworks = EXCLUDED.frameworks,
  libraries = EXCLUDED.libraries, tools = EXCLUDED.tools
ON CONFLICT DO NOTHING; -- Partial seed; SkillAnalysis upserts full list on first load

-- 6) SEED RESOURCES table for Library (demo data across domains, safe upsert by URL)
INSERT INTO public.resources (title, description, url, type, skills_covered, difficulty, platform, domain, rating) VALUES
  -- Frontend
  ('React - The Complete Guide', 'Dive into React from scratch with hooks, context, and advanced patterns', 'https://react.dev/learn', 'Course', ARRAY['React','JavaScript','TypeScript','Hooks','Context API'], 'Beginner', 'React Docs', 'Frontend Development', 4.9),
  ('Advanced React Patterns', 'Component patterns, optimization techniques, and state management', 'https://github.com/krausest/react-hooks-rules', 'Tutorial', ARRAY['React','Performance','Memoization','Custom Hooks'], 'Intermediate', 'GitHub', 'Frontend Development', 4.7),
  
  -- Backend  
  ('Node.js & Express Course', 'Build REST APIs with Node, Express, and PostgreSQL', 'https://www.youtube.com/watch?v=vh6Zx5p-kvA', 'Course', ARRAY['Node.js','Express.js','REST API','PostgreSQL'], 'Beginner', 'YouTube', 'Backend Development', 4.8),
  ('Prisma Documentation', 'Modern ORM for Node.js and TypeScript apps', 'https://www.prisma.io/docs', 'Docs', ARRAY['Prisma','TypeScript','Database','SQL'], 'Intermediate', 'Prisma', 'Backend Development', 4.9),
  
  -- Full Stack
  ('Next.js 14 Tutorial', 'Full-stack React with App Router and Server Actions', 'https://nextjs.org/docs', 'Course', ARRAY['Next.js','React','Server Components','TypeScript'], 'Intermediate', 'Next.js', 'Full Stack Development', 4.9),
  ('Docker for Developers', 'Containerize your full-stack apps', 'https://www.docker.com/101-tutorial/', 'Tutorial', ARRAY['Docker','DevOps','Deployment'], 'Beginner', 'Docker', 'Full Stack Development', 4.7),
  
  -- Data Science / AI
  ('Python for Data Analysis', 'Pandas, NumPy, and data manipulation', 'https://wesmckinney.com/book/', 'Book', ARRAY['Python','Pandas','NumPy','Data Analysis'], 'Beginner', 'O''Reilly', 'Data Science', 4.8),
  ('PyTorch Tutorials', 'Deep Learning with PyTorch from beginner to advanced', 'https://pytorch.org/tutorials/', 'Tutorial', ARRAY['PyTorch','Deep Learning','Neural Networks'], 'Intermediate', 'PyTorch', 'AI / Machine Learning', 4.9),
  
  -- DevOps/Cloud
  ('Docker Crash Course', 'Learn Docker basics and best practices', 'https://docker-curriculum.com/', 'Course', ARRAY['Docker','Containers'], 'Beginner', 'Docker Curriculum', 'DevOps', 4.8)
ON CONFLICT (url) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, type = EXCLUDED.type,
  skills_covered = EXCLUDED.skills_covered, difficulty = EXCLUDED.difficulty,
  platform = EXCLUDED.platform, domain = EXCLUDED.domain, rating = EXCLUDED.rating;

-- 7) SEED USER_SKILLS for demo user (admin: saeedayesha995@gmail.com → get UUID from profiles)
-- Replace 'DEMO_USER_UUID_HERE' with actual user_id from profiles table (or run after login)
-- Sample skills for Frontend/Full Stack bias (to show gaps in other domains)
INSERT INTO public.user_skills (user_id, skill_name, proficiency) VALUES
  ('00000000-0000-0000-0000-000000000000', 'React', 'Intermediate'),  -- Replace UUID
  ('00000000-0000-0000-0000-000000000000', 'TypeScript', 'Beginner'),
  ('00000000-0000-0000-0000-000000000000', 'Node.js', 'Beginner'),
  ('00000000-0000-0000-0000-000000000000', 'JavaScript', 'Advanced'),
  ('00000000-0000-0000-0000-000000000000', 'Docker', 'Beginner')
ON CONFLICT DO NOTHING; -- Manual adjust if needed
