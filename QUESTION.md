# Approval Needed: Role → Learning Resources linkage + Admin UI update

## Proposed change
1. **Database/seed:** Add role-to-resource linkage in the DB (e.g., a junction table such as `job_role_resources`) and seed it by matching:
   - `job_roles.required_skills[]`  ⇄  `resources.skills_covered[]`
2. **Admin UI:** Update `src/components/admin/RoleManagement.tsx` so the **Roles** admin tab shows, for each job role:
   - related **skills** (already shown)
   - related **learning resources** (new)
   - role **domain/category** (already shown)

## Files likely affected
- `sql/seed_comprehensive_job_roles.sql` (add table + seed linking)
- `src/components/admin/RoleManagement.tsx` (render resources per role)
- Potentially `/api/admin/roles` backend logic if the UI needs new fields

## Please confirm
Reply with **YES** to proceed with implementing:
- DB junction table `job_role_resources` and seeding it
- Admin `RoleManagement.tsx` update to display linked learning resources per role

Or reply with **NO** to stop.


