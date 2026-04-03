-- ============================================
-- FIX SUPABASE SECURITY WARNINGS
-- ============================================
-- Run this in Supabase SQL Editor to fix security warnings
-- ============================================

-- ============================================
-- WARNING #1: Function Search Path Mutable
-- ============================================
-- Fix: Add SECURITY DEFINER and set search_path
-- This prevents search_path manipulation attacks

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================
-- RECREATE ALL TRIGGERS
-- ============================================
-- Automatically recreate triggers for all tables with updated_at column

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %s', t, t);
    EXECUTE format(
      'CREATE TRIGGER update_%s_updated_at 
       BEFORE UPDATE ON %s 
       FOR EACH ROW 
       EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
    RAISE NOTICE 'Created trigger for table: %', t;
  END LOOP;
END$$;

-- ============================================
-- VERIFY FIX
-- ============================================
SELECT 
  routine_name as function_name,
  routine_schema,
  security_type,
  CASE 
    WHEN proconfig IS NOT NULL THEN proconfig::text
    ELSE 'No config set'
  END as search_path_config
FROM information_schema.routines
LEFT JOIN pg_proc ON proname = routine_name
WHERE routine_name = 'update_updated_at_column'
AND routine_schema = 'public';

-- ✅ Expected Result:
-- function_name: update_updated_at_column
-- security_type: DEFINER
-- search_path_config: {search_path=public}

-- ============================================
-- WARNING #2: Leaked Password Protection
-- ============================================
-- ⚠️ This CANNOT be fixed with SQL!
-- This is a Supabase Auth configuration setting.
-- 
-- TO FIX:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to: Authentication → Providers → Email
-- 3. Scroll to "Password Protection"
-- 4. Toggle ON "Enable leaked password protection"
-- 5. Click "Save"
-- 
-- This will check passwords against HaveIBeenPwned.org database
-- and prevent users from using compromised passwords.
-- ============================================

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '✅ Function search_path security fix applied!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT STEPS:';
  RAISE NOTICE '1. ✅ Function security - FIXED (run this script)';
  RAISE NOTICE '2. ⚠️  Password protection - MANUAL STEP REQUIRED';
  RAISE NOTICE '';
  RAISE NOTICE '👉 To enable leaked password protection:';
  RAISE NOTICE '   Dashboard → Authentication → Providers → Email';
  RAISE NOTICE '   → Enable "leaked password protection"';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END$$;
