create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text,
  role text default 'student',
  points integer default 0,
  level integer default 1,
  badges text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_name text not null,
  proficiency text not null check (proficiency in ('Beginner', 'Intermediate', 'Advanced')),
  updated_at timestamptz default now()
);

create table if not exists public.job_roles (
  id uuid primary key default gen_random_uuid(),
  role_name text not null unique,
  required_skills text[] not null default '{}',
  difficulty text default 'Intermediate',
  domain text default 'Full Stack',
  created_at timestamptz default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text not null unique,
  type text default 'Course',
  skills_covered text[] default '{}',
  difficulty text default 'Beginner',
  platform text default 'Unknown',
  duration text,
  rating numeric,
  domain text default 'Full Stack',
  created_at timestamptz default now()
);

create table if not exists public.trends (
  id uuid primary key default gen_random_uuid(),
  skill_name text not null unique,
  demand_score integer not null,
  growth text,
  created_at timestamptz default now()
);

create table if not exists public.trend_history (
  id uuid primary key default gen_random_uuid(),
  skill_name text not null,
  year integer not null,
  demand_score integer not null,
  growth_rate numeric,
  created_at timestamptz default now(),
  unique(skill_name, year)
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  score numeric not null default 0,
  reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, resource_id)
);

create table if not exists public.api_audit_logs (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  status text default 'Not Started',
  progress integer default 0,
  time_spent integer default 0,
  last_updated timestamptz default now(),
  unique(user_id, resource_id)
);

create table if not exists public.leaderboard (
  userId uuid primary key references public.profiles(id) on delete cascade,
  displayName text,
  photoURL text,
  points integer default 0,
  badgesCount integer default 0,
  lastUpdated timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.user_skills enable row level security;
alter table public.progress enable row level security;
alter table public.job_roles enable row level security;
alter table public.resources enable row level security;
alter table public.leaderboard enable row level security;
alter table public.trends enable row level security;
alter table public.trend_history enable row level security;
alter table public.recommendations enable row level security;
alter table public.api_audit_logs enable row level security;

drop policy if exists "profiles owner read/write" on public.profiles;
create policy "profiles owner read/write" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "skills owner read/write" on public.user_skills;
create policy "skills owner read/write" on public.user_skills
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "progress owner read/write" on public.progress;
create policy "progress owner read/write" on public.progress
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "job roles readable" on public.job_roles;
create policy "job roles readable" on public.job_roles
for select using (true);

drop policy if exists "resources readable" on public.resources;
create policy "resources readable" on public.resources
for select using (true);

drop policy if exists "leaderboard readable" on public.leaderboard;
create policy "leaderboard readable" on public.leaderboard
for select using (true);

drop policy if exists "trends readable" on public.trends;
create policy "trends readable" on public.trends
for select using (true);

drop policy if exists "trend history readable" on public.trend_history;
create policy "trend history readable" on public.trend_history
for select using (true);

drop policy if exists "recommendations owner read/write" on public.recommendations;
create policy "recommendations owner read/write" on public.recommendations
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "audit logs admin read" on public.api_audit_logs;
create policy "audit logs admin read" on public.api_audit_logs
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Skill development timeline (adds / updates / deletes on user_skills)
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

