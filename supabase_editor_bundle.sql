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
