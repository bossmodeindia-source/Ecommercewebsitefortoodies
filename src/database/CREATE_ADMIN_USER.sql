-- ============================================
-- TOODIES - CREATE ADMIN USER IN SUPABASE
-- Run this in Supabase SQL Editor
-- ============================================

-- IMPORTANT: This script creates the admin user in Supabase Auth
-- Admin credentials will be stored securely in Supabase, not in frontend code

-- ============================================
-- STEP 1: Create Admin User in Supabase Auth
-- ============================================

-- NOTE: You need to create the admin user through Supabase Dashboard or Auth API
-- Go to: Authentication > Users > Add User
-- 
-- Email: m78787531@gmail.com
-- Password: 9886510858@TcbToponeAdmin
-- 
-- OR use the Supabase CLI or API to create the user programmatically

-- ============================================
-- STEP 2: Update Admin Role in public.users Table
-- ============================================

-- After creating the user in Supabase Auth, run this to set admin role:
-- Replace 'YOUR_ADMIN_USER_ID' with the actual UUID from auth.users

UPDATE users 
SET role = 'admin', 
    is_verified = true,
    full_name = 'Admin',
    updated_at = NOW()
WHERE email = 'm78787531@gmail.com';

-- If the user doesn't exist in public.users yet, insert them:
INSERT INTO users (id, email, full_name, role, is_verified, created_at, updated_at)
SELECT 
  auth.users.id,
  'm78787531@gmail.com',
  'Admin',
  'admin',
  true,
  NOW(),
  NOW()
FROM auth.users
WHERE auth.users.email = 'm78787531@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', 
    is_verified = true,
    updated_at = NOW();

-- ============================================
-- STEP 3: Verify Admin User Creation
-- ============================================

-- Check if admin exists in public.users
SELECT id, email, full_name, role, is_verified, created_at
FROM users
WHERE email = 'm78787531@gmail.com';

-- ============================================
-- STEP 4: Update RLS Policies for Admin Access
-- ============================================

-- Create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to use the helper function
-- Drop existing policies
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Admin read all orders" ON orders;
DROP POLICY IF EXISTS "Admin manage products" ON products;
DROP POLICY IF EXISTS "Admin manage categories" ON categories;
DROP POLICY IF EXISTS "Admin manage designs" ON saved_customer_designs;

-- Create admin policies
CREATE POLICY "Admin full access" 
  ON users FOR ALL 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin read all orders" 
  ON orders FOR SELECT 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin manage products" 
  ON products FOR ALL 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin manage categories" 
  ON categories FOR ALL 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin manage designs" 
  ON saved_customer_designs FOR ALL 
  USING (public.is_admin(auth.uid()));

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ ✅ ✅ ADMIN USER SETUP INSTRUCTIONS ✅ ✅ ✅';
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT STEPS:';
  RAISE NOTICE '   1. Go to Supabase Dashboard > Authentication > Users';
  RAISE NOTICE '   2. Click "Add User" and create:';
  RAISE NOTICE '      Email: m78787531@gmail.com';
  RAISE NOTICE '      Password: 9886510858@TcbToponeAdmin';
  RAISE NOTICE '   3. Confirm the email (click "Confirm Email" in dashboard)';
  RAISE NOTICE '   4. Re-run this script to update the role to admin';
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS policies have been updated for admin access';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 SECURITY: Credentials are now stored in Supabase Auth,';
  RAISE NOTICE '   not in frontend code!';
END $$;
