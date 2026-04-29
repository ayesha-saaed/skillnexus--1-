-- Seed Top 10 Skills by Demand Score for IndustryTrends
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/[project]/sql)

INSERT INTO public.trends (skill_name, demand_score, growth) VALUES
  ('Generative AI', 98, '+15%'),
  ('Python', 97, '+18%'),
  ('Cloud Security', 96, '+9%'),
  ('React', 95, '+1%'),
  ('TypeScript', 94, '+22%'),
  ('Kubernetes', 93, '+13%'),
  ('AWS', 92, '+11%'),
  ('Docker', 91, '+9%'),
  ('Next.js', 90, '+15%'),
  ('Node.js', 89, '+8%')
ON CONFLICT (skill_name) DO UPDATE SET
  demand_score = EXCLUDED.demand_score,
  growth = EXCLUDED.growth;

-- Verify
SELECT * FROM public.trends ORDER BY demand_score DESC LIMIT 10;

