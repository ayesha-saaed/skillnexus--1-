-- Create table for admin-managed market trend skills
CREATE TABLE IF NOT EXISTS public.market_trend_skills (
  id bigserial PRIMARY KEY,
  skill_name text NOT NULL,
  demand_score integer DEFAULT 0,
  growth text DEFAULT '+0%',
  forecast text,
  created_at timestamptz DEFAULT now()
);

-- Optional: insert a seed row for AI Agent Engineering
INSERT INTO public.market_trend_skills (skill_name, demand_score, growth, forecast)
VALUES ('AI Agent Engineering', 94, '+12%', 'High')
ON CONFLICT DO NOTHING;
