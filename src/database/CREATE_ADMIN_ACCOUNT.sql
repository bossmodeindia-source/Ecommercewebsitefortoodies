-- ============================================================
-- CREATE ADMIN ACCOUNT IN SUPABASE AUTH
-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- This creates the admin user so they can login via Supabase Auth
-- ============================================================

-- STEP 1: Create admin in Supabase Auth (use Dashboard instead)
-- ❌ Cannot create auth.users via SQL - must use Supabase Dashboard or API

-- WORKAROUND: Use Supabase Dashboard
-- 1. Go to: Authentication → Users → Add User
-- 2. Enter:
--    Email: m78787531@gmail.com
--    Password: 9886510858@TcbToponeAdmin
--    Auto Confirm: YES (toggle ON)
-- 3. Click "Create User"

-- STEP 2: After creating the user in the dashboard, run this to set them as admin

-- First, get the UUID that was created
-- SELECT id, email FROM auth.users WHERE email = 'm78787531@gmail.com';

-- Then insert into public.users (replace 'PASTE_UUID_HERE' with actual UUID)
/*
INSERT INTO public.users (
  id,
  email,
  name,
  full_name,
  role,
  is_verified,
  created_at,
  updated_at
) VALUES (
  'PASTE_UUID_HERE',  -- ← Replace with actual UUID from auth.users
  'm78787531@gmail.com',
  'Toodies Admin',
  'Toodies Admin',
  'admin',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      is_verified = true,
      updated_at = now();
*/

-- STEP 3: Verify admin was created
SELECT 
  u.id,
  u.email,
  u.role,
  u.name,
  au.email as auth_email,
  au.confirmed_at
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.role = 'admin';

-- ============================================================
-- ALTERNATIVE: BYPASS MODE (Already Works!)
-- ============================================================
-- The app has a built-in bypass mode that works WITHOUT
-- creating a Supabase Auth account.
--
-- Just login with:
--   Email: m78787531@gmail.com
--   Password: 9886510858@TcbToponeAdmin
--
-- The bypass will work if:
--   1. Supabase Auth fails (no account)
--   2. OR Supabase is unreachable
--   3. AND credentials exactly match
--
-- Check browser console for debug logs!
-- ============================================================

-- ============================================================
-- TROUBLESHOOTING
-- ============================================================

-- 1. If login fails with "Invalid credentials":
--    - Check browser console for detailed logs
--    - Verify email/password (case-sensitive password!)
--    - Try clearing browser cache and localStorage
--    - Make sure you're using the correct email

-- 2. To manually test the bypass in browser console:
/*
localStorage.setItem('toodies_access_token', 'bypass-admin-test');
localStorage.setItem('toodies_user', JSON.stringify({
  id: 'admin-bypass-local',
  email: 'm78787531@gmail.com',
  name: 'Toodies Admin',
  full_name: 'Toodies Admin',
  role: 'admin',
  email_verified: true,
  is_verified: true,
  created_at: new Date().toISOString()
}));
localStorage.setItem('admin_bypass_active', 'true');
// Then refresh the page
*/

-- 3. Check current localStorage state:
-- Open browser console and type:
-- localStorage.getItem('toodies_user')

-- 4. Clear all auth data and try again:
/*
localStorage.clear();
// Then refresh and try login again
*/

-- ============================================================
-- EXPECTED BEHAVIOR
-- ============================================================

-- When you login, you should see these console logs:
-- 🔐 ===== ADMIN LOGIN =====
-- 🔑 Trying Supabase Auth...
-- ⚠️ Supabase Auth unavailable or wrong creds — trying bypass...
-- 🔓 Attempting credential bypass...
-- ✅ Bypass admin login granted
-- ✅ Admin bypass session stored
-- ===== END LOGIN =====

-- If you see "❌ All login methods failed" it means:
-- - Supabase Auth failed (no account or wrong credentials)
-- - AND bypass failed (credentials don't match exactly)

-- Solution: Check the debug logs to see which part is failing!
-- ============================================================
