-- =============================================
-- 🚀 COPY-PASTE FIX - One Command Setup
-- =============================================
-- STEP 1: Create user in Supabase Dashboard first:
--   Authentication → Users → Add User
--   Email: m78787531@gmail.com  
--   Password: 9886510858@TcbToponeAdmin
--   ✅ Auto Confirm User
--
-- STEP 2: Then copy and paste THIS ENTIRE FILE 
--   into SQL Editor and click RUN
-- =============================================

-- Fix admin profile (creates if missing, updates if exists)
INSERT INTO users (id, email, full_name, role, is_verified)
SELECT 
  id,
  email,
  'Admin',
  'admin',
  true
FROM auth.users
WHERE email = 'm78787531@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  is_verified = true,
  full_name = 'Admin',
  updated_at = now();

-- =============================================
-- VERIFICATION QUERIES (results show below)
-- =============================================

-- Result 1: Admin in auth.users
SELECT 
  '✅ AUTH CHECK' as status,
  id as user_id,
  email,
  CASE WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed' ELSE 'Not Confirmed' END as email_status
FROM auth.users
WHERE email = 'm78787531@gmail.com';

-- Result 2: Admin in public.users  
SELECT 
  '✅ PROFILE CHECK' as status,
  id as user_id,
  email,
  role,
  full_name,
  is_verified
FROM users
WHERE email = 'm78787531@gmail.com';

-- Result 3: Final validation
SELECT 
  CASE 
    WHEN (SELECT role FROM users WHERE email = 'm78787531@gmail.com') = 'admin' 
    THEN '🎉 SUCCESS! Admin is ready. Try logging in now!'
    ELSE '❌ FAILED: Role is not admin. Contact support.'
  END as final_result;

-- =============================================
-- EXPECTED OUTPUT:
-- =============================================
-- Query 1: Should show 1 row with UUID and email
-- Query 2: Should show 1 row with role='admin'
-- Query 3: Should show "🎉 SUCCESS!"
-- =============================================
-- If you see "🎉 SUCCESS!", go test the login!
-- =============================================
