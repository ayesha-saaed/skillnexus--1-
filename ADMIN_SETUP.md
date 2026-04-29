# Admin Dashboard Setup Guide

## Prerequisites

- ✅ Supabase project configured
- ✅ React app running with authentication
- ✅ TypeScript and Tailwind CSS installed
- ✅ Lucide React icons library

## Step-by-Step Setup

### 1. **Database Setup**

Run the SQL schema in Supabase SQL Editor:

```bash
# Open: https://app.supabase.com/project/[your-project]/sql
# Paste the content from: sql/add_admin_schema.sql
# Click: Run
```

This will create:
- `domains` table
- `skills` table with foreign key to domains
- `audit_logs` table for admin actions
- Row Level Security (RLS) policies
- Admin stats view

### 2. **Environment Variables**

Ensure your `.env.local` has:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. **Component Installation**

All admin components are already in:
```
src/components/admin/
├── AdminDashboard.tsx
├── AdminAnalytics.tsx
├── DomainManagement.tsx
├── SkillManagement.tsx
├── ResourceManagement.tsx
├── UserManagement.tsx
├── AdminTable.tsx
├── AdminModal.tsx
├── AdminInput.tsx
├── AdminSelect.tsx
├── useToast.tsx
└── index.ts
```

### 4. **Admin User Configuration**

In `src/App.tsx`, set the admin email:

```typescript
const isAdminEmail = u.email === 'your-admin-email@example.com';
```

Or add multiple admins:

```typescript
const adminEmails = ['admin1@example.com', 'admin2@example.com'];
const isAdminEmail = adminEmails.includes(u.email || '');
```

### 5. **Enable Admin Access**

The admin dashboard is automatically available when:
- User is logged in
- User role is 'admin' in database
- Admin email is verified

### 6. **Access Admin Dashboard**

```typescript
// From any page, navigate to admin
onNavigate('admin')

// This triggers AdminDashboard component
// Which checks role and displays dashboard
```

## Database Tables

### Domains Table
```sql
CREATE TABLE public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Skills Table
```sql
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Resources Enhancement
```sql
ALTER TABLE public.resources 
ADD COLUMN skill_ids UUID[] DEFAULT '{}';

CREATE INDEX idx_resources_skill_ids 
ON public.resources USING GIN (skill_ids);
```

### Audit Logs Table
```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Row Level Security (RLS)

All admin operations are protected by RLS policies:

```sql
-- Public can read domains, skills, resources
CREATE POLICY "public read" ON public.domains FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "admin full" ON public.domains FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
) WITH CHECK (same);
```

## Testing Admin Features

### 1. **Login as Admin**
```
Email: saeedayesha995@gmail.com (or your configured admin email)
Password: Your password
```

### 2. **Navigate to Admin**
- Click "Admin" in navigation (if visible)
- Or use navigation system: `onNavigate('admin')`

### 3. **Test Domain Creation**
```
1. Go to Domains tab
2. Click "Add Domain"
3. Fill: "Web Development", description, color
4. Click Save
5. Verify in Supabase dashboard
```

### 4. **Test Skill Creation**
```
1. Go to Skills tab
2. Click "Add Skill"
3. Select domain, add skill name
4. Click Save
5. Verify link in database
```

### 5. **Test Resource Creation**
```
1. Go to Resources tab
2. Click "Add Resource"
3. Add title, URL, type, difficulty
4. Click Save
5. Verify in database
```

### 6. **Test User Management**
```
1. Go to Users tab
2. View all registered users
3. Try changing a user's role
4. Verify in profiles table
```

## Verification Checklist

- [ ] Supabase SQL schema executed
- [ ] All tables created in database
- [ ] RLS policies enabled
- [ ] Admin email configured
- [ ] AdminDashboard imports correctly
- [ ] Can navigate to admin page
- [ ] Can view dashboard statistics
- [ ] Can add a test domain
- [ ] Can add a test skill
- [ ] Can add a test resource
- [ ] Can modify user roles
- [ ] Toast notifications appear
- [ ] Data saves to database

## Common Issues & Solutions

### Issue: "Access denied: Admin privileges required"
**Solution:**
- Check user's profile role in Supabase (should be 'admin')
- Verify admin email configuration in App.tsx
- Clear browser cache and re-login

### Issue: Database operations fail
**Solution:**
- Verify Supabase credentials in .env
- Check RLS policies are created
- Ensure tables exist in database
- Check browser console for detailed error

### Issue: Components don't show
**Solution:**
- Verify all imports in AdminDashboard.tsx
- Check file paths are correct
- Restart dev server
- Clear node_modules and reinstall

### Issue: Styling looks wrong
**Solution:**
- Verify Tailwind CSS is processing admin files
- Check tailwind.config.js includes admin folder
- Rebuild CSS with: `npm run build`
- Clear browser cache

## Next Steps

1. **Customize admin email** - Update App.tsx
2. **Test all CRUD operations** - Try creating/editing/deleting
3. **Review RLS policies** - Ensure security settings
4. **Add audit logging** - Track admin actions
5. **Set up backups** - Regular database backups
6. **Monitor usage** - Check analytics dashboard

## Deployment

### Before Going Live

```bash
# 1. Test all admin functions
npm run dev

# 2. Build for production
npm run build

# 3. Test production build
npm run preview

# 4. Verify environment variables
# Ensure VITE_SUPABASE_* are set in production

# 5. Deploy to hosting
# (Vercel, Netlify, etc.)
```

### Post-Deployment

- Monitor admin panel usage
- Check error logs
- Verify database backups
- Update admin documentation
- Train administrators

## Security Checklist

- [ ] Admin email is secure
- [ ] RLS policies are correct
- [ ] No hardcoded credentials
- [ ] HTTPS enabled on deployment
- [ ] Database backups configured
- [ ] Activity logging enabled
- [ ] Admin password is strong
- [ ] 2FA enabled for admin (recommended)

## Support

For help with:
- **Database issues** → Check Supabase dashboard
- **Component errors** → Check browser console
- **Authentication** → Review lib/firebase.ts
- **Styling** → Check Tailwind CSS configuration
- **Performance** → Check network tab in DevTools

---

**Setup Time:** 15-30 minutes
**Difficulty Level:** Intermediate
**Last Updated:** April 2026
