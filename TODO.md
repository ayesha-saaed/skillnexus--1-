# Admin Dashboard Implementation Plan
Approved by user. Breaking down into logical steps. Will update progress.

## Step 1: Database Schema Updates [WAITING USER ACTION]
- [x] Create `skills` table (domain_id FK)
- [x] Update `resources` (add skill_ids[])
- [x] Add admin RLS policies (full CRUD)
- [x] Seed initial domains/skills from knowledge_base.ts
- [x] Create `add_admin_schema.sql` **(USER: Run in Supabase SQL Editor!)**


## Step 2: Install Dependencies [PENDING]
- [ ] shadcn: table, dialog, form, toast, card, badge, button
- [ ] recharts, lucide-react (if missing)
- [ ] zod, @hookform/resolvers

## Step 3: Admin Auth & Layout [PENDING]
- [ ] src/lib/useAdmin.ts hook
- [ ] src/pages/AdminLogin.tsx
- [ ] src/components/AdminLayout.tsx (sidebar)
- [ ] Update App.tsx routes/protection

## Step 4: Admin Pages [PENDING]
- [ ] src/pages/admin/Overview.tsx (stats/charts)
- [ ] src/pages/admin/Domains.tsx (CRUD)
- [ ] src/pages/admin/Skills.tsx (CRUD, domain select)
- [ ] src/pages/admin/Resources.tsx (full form, filters)
- [ ] src/pages/admin/Users.tsx (mgmt)
- [ ] Refactor existing Admin.tsx

## Step 5: Components & Utils [PENDING]
- [ ] src/components/admin/DataTable.tsx
- [ ] src/components/admin/CrudModal.tsx
- [ ] src/hooks/useAdminQuery.ts (SWR/mutate)

## Step 6: Testing & Polish [PENDING]
- [ ] Seed admin user
- [ ] Test all CRUD/real-time
- [ ] Responsive/charts/notifications
- [ ] attempt_completion

**Current Progress: Starting Step 1**

