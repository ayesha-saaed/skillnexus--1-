# Add Market Data for Top 10 Skills by Demand Score

Status: In Progress

## Plan Steps

### 1. Verify Current Data
- Check # records in trends/trend_history
- Test /api/industry-trends endpoint

### 2. Enhance Data Seeding
- Edit src/lib/data_seeder.ts: Add 10+ top skills to INDUSTRY_DEMAND_HISTORICAL
- Run POST /api/admin/seed to populate DB

### 3. Update Frontend
- Edit src/pages/IndustryTrends.tsx: Remove hardcoded fallback in fetchTrends()
- Ensure displays dynamic top 10 from API

### 4. Testing & Polish
- Verify page shows top 10 by demand_score
- Test sorting (demand/growth)
- Optional: Direct Supabase query

## Progress
- [x] Step 1 Complete (verified empty → seeded 10 skills)
- [x] Step 2 Complete (SQL seed + API now returns top 10)
- [x] Step 3 Complete (removed fallback + moved rank badge left)
- [x] Step 4 Complete (feedback addressed)


Next Action: Start Step 1

