-- ============================================
-- LEAKED PASSWORD PROTECTION
-- ============================================
-- ⚠️ IMPORTANT: THIS CANNOT BE FIXED WITH SQL!
-- ============================================
--
-- The "Leaked Password Protection" setting is a 
-- Supabase Auth configuration that MUST be enabled
-- through the Supabase Dashboard UI.
--
-- There is NO SQL command to enable this feature.
-- It is controlled by Supabase's authentication service,
-- not the PostgreSQL database.
--
-- ============================================

-- ============================================
-- WHY SQL CAN'T FIX THIS
-- ============================================
--
-- The password checking happens in Supabase's Auth API layer,
-- which sits ABOVE the database. The Auth API:
--
-- 1. Receives signup/password change requests
-- 2. Checks against HaveIBeenPwned.org API
-- 3. Only then creates database records
--
-- The database never sees the plaintext password,
-- so it cannot implement this check via SQL.
--
-- ============================================

-- ============================================
-- HOW TO ACTUALLY FIX THIS
-- ============================================
--
-- YOU MUST USE THE SUPABASE DASHBOARD:
--
-- 1. Go to: https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/auth/providers
-- 2. Expand "Email" section
-- 3. Scroll to "Password Protection"
-- 4. Toggle ON: "Enable leaked password protection"
-- 5. Click "Save"
--
-- Time: 60 seconds
-- Difficulty: Very Easy
--
-- Full guide: /ENABLE_PASSWORD_PROTECTION_NOW.md
--
-- ============================================

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these AFTER enabling in dashboard to verify

-- Check if Auth is configured (basic check)
SELECT 
    key,
    value
FROM auth.config
WHERE key LIKE '%password%'
ORDER BY key;

-- Note: The leaked password protection setting is NOT
-- stored in the database - it's in Supabase's Auth service
-- configuration. These queries won't show the setting.

-- ============================================
-- TEST IF IT'S WORKING
-- ============================================
-- After enabling in dashboard, try this test:
--
-- 1. Go to your app's signup page
-- 2. Try to signup with email: test@test.com
-- 3. Use password: "password123" (known compromised password)
-- 4. Expected result: Error message about compromised password
--
-- If you get the error, the feature is working!

-- ============================================
-- ALTERNATIVE: CHECK AUTH LOGS
-- ============================================
-- To verify it's enabled, check Supabase logs:
--
-- 1. Dashboard → Logs → Auth Logs
-- 2. Look for entries with "password_strength" checks
-- 3. Enabled feature will show password validation logs

-- ============================================
-- DATABASE-LEVEL PASSWORD POLICIES
-- ============================================
-- While we can't enable HaveIBeenPwned checking via SQL,
-- we CAN add basic password requirements at database level
-- (but this is NOT a substitute for dashboard setting!)

-- Create a function to validate password strength (basic)
CREATE OR REPLACE FUNCTION validate_password_strength(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic checks (NOT a replacement for HaveIBeenPwned!)
    RETURN (
        LENGTH(password) >= 8 AND                    -- At least 8 characters
        password ~ '[A-Z]' AND                       -- At least one uppercase
        password ~ '[a-z]' AND                       -- At least one lowercase
        password ~ '[0-9]' AND                       -- At least one number
        password !~* '(password|123456|qwerty)'      -- Not common passwords
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Test the function
SELECT validate_password_strength('password123');  -- Should return FALSE
SELECT validate_password_strength('MyP@ssw0rd');   -- Should return TRUE

-- ⚠️ WARNING: This function does NOT replace HaveIBeenPwned!
-- It only does basic validation. You MUST enable the
-- dashboard setting for real compromised password protection.

-- ============================================
-- WHAT THE DASHBOARD SETTING ACTUALLY DOES
-- ============================================
--
-- When enabled, Supabase Auth will:
--
-- 1. On signup: Check password against HaveIBeenPwned API
-- 2. On password change: Check new password
-- 3. If found in breach database: Reject with error
-- 4. If not found: Allow signup/change to proceed
--
-- This happens BEFORE any SQL queries run.
-- The database only receives already-validated passwords.
--
-- ============================================

-- ============================================
-- SUMMARY
-- ============================================
--
-- ❌ SQL Cannot: Enable leaked password protection
-- ✅ SQL Can:    Add basic password rules (not sufficient)
-- ✅ Dashboard:  Enable full HaveIBeenPwned protection
--
-- ACTION REQUIRED: Use Dashboard (60 seconds)
--
-- Direct Link:
-- https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/auth/providers
--
-- ============================================

-- ============================================
-- INFORMATIONAL QUERIES
-- ============================================

-- Check auth schema tables (for reference)
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'auth'
ORDER BY table_name;

-- Check auth configuration keys
SELECT 
    key,
    CASE 
        WHEN key LIKE '%password%' THEN value
        WHEN key LIKE '%security%' THEN value
        ELSE '[redacted]'
    END as value
FROM auth.config
WHERE key IN (
    'password_min_length',
    'password_required_characters',
    'security_manual_linking_enabled'
)
ORDER BY key;

-- Note: 'leaked_password_protection' is NOT in this table
-- because it's a Supabase Auth API setting, not a DB setting.

-- ============================================
-- FINAL MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '⚠️  SQL CANNOT FIX THIS WARNING!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Leaked Password Protection is a Supabase Auth';
    RAISE NOTICE 'configuration setting that can ONLY be enabled';
    RAISE NOTICE 'through the Dashboard UI.';
    RAISE NOTICE '';
    RAISE NOTICE '👉 ACTION REQUIRED:';
    RAISE NOTICE '   1. Open Dashboard';
    RAISE NOTICE '   2. Go to: Authentication → Providers → Email';
    RAISE NOTICE '   3. Toggle ON "leaked password protection"';
    RAISE NOTICE '   4. Click Save';
    RAISE NOTICE '';
    RAISE NOTICE '⏱️  Time: 60 seconds';
    RAISE NOTICE '📖 Guide: /ENABLE_PASSWORD_PROTECTION_NOW.md';
    RAISE NOTICE '';
    RAISE NOTICE 'Direct Link:';
    RAISE NOTICE 'https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/auth/providers';
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
END$$;

-- ============================================
-- HELPFUL LINKS
-- ============================================
--
-- Supabase Documentation:
-- https://supabase.com/docs/guides/auth/password-security
--
-- HaveIBeenPwned API:
-- https://haveibeenpwned.com/API/v3
--
-- Your Fix Guides:
-- /ENABLE_PASSWORD_PROTECTION_NOW.md
-- /PASSWORD_PROTECTION_VISUAL_GUIDE.md
-- /SECURITY_FIX_CHECKLIST.md
-- /SECURITY_WARNINGS_FIX_GUIDE.md
--
-- ============================================
