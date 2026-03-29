-- =============================================
-- FIX ADMIN USER - Complete Setup Script
-- =============================================
-- Run this in Supabase SQL Editor after creating 
-- the admin user in Authentication → Users
-- =============================================

-- Step 1: Verify admin exists in auth.users
-- (This should return 1 row if you created the user in Auth UI)
SELECT 
  'Checking auth.users...' as step,
  id,
  email,
  email_confirmed_at
FROM auth.users
WHERE email = 'm78787531@gmail.com';

-- Step 2: Create/Update admin profile in public.users
-- This ensures the admin has the correct role
INSERT INTO users (id, email, full_name, role, is_verified)
SELECT 
  id,
  email,
  'Admin',
  'admin',
  true
FROM auth.users
WHERE email = 'm78787531@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET 
  role = 'admin', 
  is_verified = true,
  full_name = 'Admin',
  updated_at = now();

-- Step 3: Verify admin was created/updated correctly
SELECT 
  'Verification Result:' as step,
  id,
  email,
  full_name,
  role,
  is_verified,
  created_at,
  CASE 
    WHEN role = 'admin' THEN '✅ ADMIN ROLE CORRECT'
    ELSE '❌ ROLE IS WRONG - Should be admin'
  END as status
FROM users
WHERE email = 'm78787531@gmail.com';

-- Step 4: Show both auth and public user side by side
SELECT 
  'Final Check - auth.users' as source,
  u.id,
  u.email,
  u.email_confirmed_at::text as confirmed,
  NULL as role,
  NULL as full_name
FROM auth.users u
WHERE u.email = 'm78787531@gmail.com'

UNION ALL

SELECT 
  'Final Check - public.users' as source,
  p.id,
  p.email,
  NULL as confirmed,
  p.role,
  p.full_name
FROM users p
WHERE p.email = 'm78787531@gmail.com';

-- =============================================
-- EXPECTED OUTPUT:
-- =============================================
-- Query 1: Should show 1 row from auth.users
-- Query 2: Inserts/updates (no output)
-- Query 3: Should show role = 'admin' with ✅
-- Query 4: Should show 2 rows with SAME UUID:
--   - Row 1: auth.users (has email_confirmed_at)
--   - Row 2: public.users (has role='admin')
-- =============================================

-- =============================================
-- If the ID in both tables is the SAME UUID:
-- ✅ SUCCESS! Your admin is set up correctly!
-- =============================================
-- The UUID (e.g., 28455520-9eda-4785-821d-95be851dc72a)
-- is NORMAL and CORRECT. This is how Supabase works.
-- =============================================
