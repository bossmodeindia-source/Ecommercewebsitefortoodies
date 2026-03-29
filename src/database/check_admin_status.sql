-- =============================================
-- QUICK ADMIN STATUS CHECK
-- =============================================
-- Copy and paste this entire script into 
-- Supabase SQL Editor and click "Run"
-- =============================================

-- Check 1: Does admin exist in Supabase Auth?
SELECT 
  '1️⃣ AUTH USER CHECK' as check_name,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Admin exists in auth.users'
    WHEN COUNT(*) = 0 THEN '❌ Admin NOT found in auth.users - CREATE USER FIRST'
    ELSE '⚠️ Multiple users with same email!'
  END as result,
  COUNT(*) as user_count
FROM auth.users
WHERE email = 'm78787531@gmail.com';

-- Check 2: Show auth user details
SELECT 
  '2️⃣ AUTH USER DETAILS' as check_name,
  id as user_id,
  email,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Not Confirmed'
  END as email_status,
  created_at
FROM auth.users
WHERE email = 'm78787531@gmail.com';

-- Check 3: Does admin profile exist in public.users?
SELECT 
  '3️⃣ PUBLIC USER CHECK' as check_name,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ Admin profile exists in public.users'
    WHEN COUNT(*) = 0 THEN '❌ Admin profile NOT found - RUN FIX SCRIPT'
    ELSE '⚠️ Duplicate profiles found!'
  END as result,
  COUNT(*) as profile_count
FROM users
WHERE email = 'm78787531@gmail.com';

-- Check 4: Show public user profile details
SELECT 
  '4️⃣ PUBLIC USER DETAILS' as check_name,
  id as user_id,
  email,
  full_name,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ CORRECT ROLE'
    WHEN role IS NULL THEN '❌ ROLE IS NULL - RUN FIX SCRIPT'
    ELSE '❌ WRONG ROLE: ' || role || ' - RUN FIX SCRIPT'
  END as role_status,
  is_verified,
  created_at
FROM users
WHERE email = 'm78787531@gmail.com';

-- Check 5: Compare IDs (must match!)
SELECT 
  '5️⃣ ID COMPARISON CHECK' as check_name,
  CASE 
    WHEN auth_id = public_id THEN '✅ IDs MATCH - PERFECT!'
    WHEN auth_id IS NULL THEN '❌ No auth user found'
    WHEN public_id IS NULL THEN '❌ No public profile found - RUN FIX SCRIPT'
    ELSE '❌ IDs DO NOT MATCH - DATA CORRUPTION!'
  END as result,
  auth_id,
  public_id
FROM (
  SELECT 
    (SELECT id FROM auth.users WHERE email = 'm78787531@gmail.com') as auth_id,
    (SELECT id FROM users WHERE email = 'm78787531@gmail.com') as public_id
) as comparison;

-- Check 6: Final diagnostic summary
SELECT 
  '6️⃣ FINAL SUMMARY' as check_name,
  CASE 
    WHEN auth_count = 0 THEN '❌ STEP 1: Create user in Authentication → Users'
    WHEN public_count = 0 THEN '❌ STEP 2: Run /database/fix_admin.sql'
    WHEN role != 'admin' THEN '❌ STEP 3: Run UPDATE users SET role=''admin'' WHERE email=''m78787531@gmail.com'''
    WHEN auth_count = 1 AND public_count = 1 AND role = 'admin' THEN '✅ ADMIN IS READY - TRY LOGIN NOW!'
    ELSE '⚠️ Unknown issue - check details above'
  END as next_step
FROM (
  SELECT 
    (SELECT COUNT(*) FROM auth.users WHERE email = 'm78787531@gmail.com') as auth_count,
    (SELECT COUNT(*) FROM users WHERE email = 'm78787531@gmail.com') as public_count,
    (SELECT role FROM users WHERE email = 'm78787531@gmail.com' LIMIT 1) as role
) as summary;

-- =============================================
-- HOW TO READ THE RESULTS:
-- =============================================
-- Look at Check 6 (FINAL SUMMARY) for next steps
-- 
-- ✅ All checks green = Admin ready to login!
-- ❌ Any red checks = Follow the instruction shown
-- =============================================
