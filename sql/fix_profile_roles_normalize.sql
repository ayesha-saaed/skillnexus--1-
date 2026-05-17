-- sql-dialect=postgres
-- One-time cleanup if profiles.role was set incorrectly (e.g. everyone as admin).
-- Review the SELECT before running the UPDATE.

SELECT id, email, role FROM public.profiles ORDER BY email;

-- Normalize unknown roles to student (keeps admin and moderator as-is)
UPDATE public.profiles
SET role = CASE
  WHEN lower(trim(role)) = 'admin' THEN 'admin'
  WHEN lower(trim(role)) = 'moderator' THEN 'moderator'
  ELSE 'student'
END
WHERE role IS NULL
   OR lower(trim(role)) NOT IN ('admin', 'moderator', 'student');

-- Keep only your account as admin; set teammates to student (edit the email):
-- UPDATE public.profiles
-- SET role = 'student'
-- WHERE role = 'admin'
--   AND email NOT ILIKE 'ayeshrao2004@gmail.com';
