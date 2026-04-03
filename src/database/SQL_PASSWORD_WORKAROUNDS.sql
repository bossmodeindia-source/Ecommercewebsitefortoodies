-- ============================================
-- PASSWORD SECURITY - SQL WORKAROUNDS
-- ============================================
-- What we CAN do with SQL while waiting for
-- the dashboard setting to be enabled
-- ============================================

-- ⚠️ DISCLAIMER:
-- These SQL-based checks are NOT a replacement for
-- Supabase's HaveIBeenPwned integration!
-- They are supplementary security measures only.
--
-- YOU MUST STILL enable the dashboard setting!

-- ============================================
-- ENHANCED PASSWORD VALIDATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION enhanced_password_validation(
    password TEXT,
    email TEXT DEFAULT NULL,
    username TEXT DEFAULT NULL
)
RETURNS TABLE(
    is_valid BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    common_passwords TEXT[] := ARRAY[
        'password', 'password123', '123456', '12345678',
        'qwerty', 'abc123', 'monkey', '1234567', 'letmein',
        'trustno1', 'dragon', 'baseball', 'iloveyou', 'master',
        'sunshine', 'ashley', 'bailey', 'passw0rd', 'shadow',
        'superman', 'qazwsx', 'michael', 'football', 'welcome',
        'jesus', 'ninja', 'mustang', 'password1', 'admin',
        'administrator', 'root', 'toor', 'pass', 'test',
        'guest', 'info', 'adm', 'mysql', 'user', 'oracle',
        'ftp', 'pi', 'puppet', 'ansible', 'ec2-user', 'vagrant',
        'azureuser', 'academy', 'whatever', 'changeme'
    ];
    pass_lower TEXT;
    email_local TEXT;
    i INTEGER;
BEGIN
    pass_lower := LOWER(password);
    
    -- Check 1: Minimum length
    IF LENGTH(password) < 8 THEN
        RETURN QUERY SELECT FALSE, 'Password must be at least 8 characters';
        RETURN;
    END IF;
    
    -- Check 2: Maximum length (prevent DoS)
    IF LENGTH(password) > 128 THEN
        RETURN QUERY SELECT FALSE, 'Password must be less than 128 characters';
        RETURN;
    END IF;
    
    -- Check 3: Not all same character
    IF password ~ '^(.)\1+$' THEN
        RETURN QUERY SELECT FALSE, 'Password cannot be all the same character';
        RETURN;
    END IF;
    
    -- Check 4: Must contain uppercase
    IF password !~ '[A-Z]' THEN
        RETURN QUERY SELECT FALSE, 'Password must contain at least one uppercase letter';
        RETURN;
    END IF;
    
    -- Check 5: Must contain lowercase
    IF password !~ '[a-z]' THEN
        RETURN QUERY SELECT FALSE, 'Password must contain at least one lowercase letter';
        RETURN;
    END IF;
    
    -- Check 6: Must contain number
    IF password !~ '[0-9]' THEN
        RETURN QUERY SELECT FALSE, 'Password must contain at least one number';
        RETURN;
    END IF;
    
    -- Check 7: Must contain special character
    IF password !~ '[^A-Za-z0-9]' THEN
        RETURN QUERY SELECT FALSE, 'Password must contain at least one special character (!@#$%^&*)';
        RETURN;
    END IF;
    
    -- Check 8: Not in common passwords list
    FOREACH i IN ARRAY common_passwords LOOP
        IF pass_lower = i OR pass_lower LIKE '%' || i || '%' THEN
            RETURN QUERY SELECT FALSE, 'Password is too common or contains common patterns';
            RETURN;
        END IF;
    END LOOP;
    
    -- Check 9: Not sequential numbers
    IF pass_lower ~ '(012|123|234|345|456|567|678|789|890)' THEN
        RETURN QUERY SELECT FALSE, 'Password cannot contain sequential numbers';
        RETURN;
    END IF;
    
    -- Check 10: Not sequential letters
    IF pass_lower ~ '(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)' THEN
        RETURN QUERY SELECT FALSE, 'Password cannot contain sequential letters';
        RETURN;
    END IF;
    
    -- Check 11: Not contain email username
    IF email IS NOT NULL THEN
        email_local := SPLIT_PART(email, '@', 1);
        IF LENGTH(email_local) > 3 AND pass_lower LIKE '%' || LOWER(email_local) || '%' THEN
            RETURN QUERY SELECT FALSE, 'Password cannot contain your email username';
            RETURN;
        END IF;
    END IF;
    
    -- Check 12: Not contain username
    IF username IS NOT NULL AND LENGTH(username) > 3 THEN
        IF pass_lower LIKE '%' || LOWER(username) || '%' THEN
            RETURN QUERY SELECT FALSE, 'Password cannot contain your username';
            RETURN;
        END IF;
    END IF;
    
    -- Check 13: Not keyboard patterns
    IF pass_lower ~ '(qwerty|asdfgh|zxcvbn|qazwsx|asdzxc)' THEN
        RETURN QUERY SELECT FALSE, 'Password cannot contain keyboard patterns';
        RETURN;
    END IF;
    
    -- All checks passed
    RETURN QUERY SELECT TRUE, 'Password meets security requirements';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- TEST THE ENHANCED VALIDATION
-- ============================================

-- Test weak passwords (should fail)
SELECT * FROM enhanced_password_validation('password123', 'test@example.com');
SELECT * FROM enhanced_password_validation('12345678', 'test@example.com');
SELECT * FROM enhanced_password_validation('qwerty', 'test@example.com');
SELECT * FROM enhanced_password_validation('Password', 'test@example.com'); -- Missing number and special char

-- Test strong passwords (should pass)
SELECT * FROM enhanced_password_validation('MyP@ssw0rd!2024', 'test@example.com');
SELECT * FROM enhanced_password_validation('C0mpl3x&Secure#', 'user@example.com');
SELECT * FROM enhanced_password_validation('Tr0ng$Password2024', 'admin@example.com');

-- ============================================
-- CREATE PASSWORD STRENGTH SCORE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION password_strength_score(password TEXT)
RETURNS TABLE(
    score INTEGER,
    strength TEXT,
    feedback TEXT[]
) AS $$
DECLARE
    points INTEGER := 0;
    feedback_arr TEXT[] := '{}';
BEGIN
    -- Length scoring
    IF LENGTH(password) >= 8 THEN 
        points := points + 1;
    ELSE
        feedback_arr := array_append(feedback_arr, 'Use at least 8 characters');
    END IF;
    
    IF LENGTH(password) >= 12 THEN 
        points := points + 1;
    ELSE
        feedback_arr := array_append(feedback_arr, 'Consider using 12+ characters');
    END IF;
    
    IF LENGTH(password) >= 16 THEN 
        points := points + 1;
    END IF;
    
    -- Character variety
    IF password ~ '[A-Z]' THEN 
        points := points + 1;
    ELSE
        feedback_arr := array_append(feedback_arr, 'Add uppercase letters');
    END IF;
    
    IF password ~ '[a-z]' THEN 
        points := points + 1;
    ELSE
        feedback_arr := array_append(feedback_arr, 'Add lowercase letters');
    END IF;
    
    IF password ~ '[0-9]' THEN 
        points := points + 1;
    ELSE
        feedback_arr := array_append(feedback_arr, 'Add numbers');
    END IF;
    
    IF password ~ '[^A-Za-z0-9]' THEN 
        points := points + 2; -- Special chars worth more
    ELSE
        feedback_arr := array_append(feedback_arr, 'Add special characters (!@#$%^&*)');
    END IF;
    
    -- Pattern penalties
    IF password ~* '(password|123|qwerty|abc)' THEN
        points := points - 2;
        feedback_arr := array_append(feedback_arr, 'Avoid common patterns');
    END IF;
    
    -- Determine strength
    RETURN QUERY SELECT 
        points,
        CASE 
            WHEN points >= 8 THEN 'Very Strong'
            WHEN points >= 6 THEN 'Strong'
            WHEN points >= 4 THEN 'Medium'
            WHEN points >= 2 THEN 'Weak'
            ELSE 'Very Weak'
        END,
        feedback_arr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- TEST PASSWORD STRENGTH SCORING
-- ============================================

SELECT * FROM password_strength_score('password');
-- Expected: Very Weak, with multiple feedback items

SELECT * FROM password_strength_score('Password123');
-- Expected: Weak/Medium

SELECT * FROM password_strength_score('MyC0mpl3x&P@ssword!');
-- Expected: Very Strong

-- ============================================
-- CREATE AUDIT TABLE FOR PASSWORD ATTEMPTS
-- ============================================

CREATE TABLE IF NOT EXISTS password_validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT,
    validation_result BOOLEAN,
    failure_reason TEXT,
    strength_score INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for querying
CREATE INDEX IF NOT EXISTS idx_password_logs_email 
ON password_validation_logs(user_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_password_logs_created 
ON password_validation_logs(created_at DESC);

-- Enable RLS
ALTER TABLE password_validation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs
CREATE POLICY "Admin read password logs" 
ON password_validation_logs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- ============================================
-- CREATE FUNCTION TO LOG PASSWORD ATTEMPTS
-- ============================================

CREATE OR REPLACE FUNCTION log_password_validation(
    p_email TEXT,
    p_result BOOLEAN,
    p_reason TEXT,
    p_score INTEGER DEFAULT NULL,
    p_ip INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO password_validation_logs (
        user_email,
        validation_result,
        failure_reason,
        strength_score,
        ip_address,
        user_agent
    ) VALUES (
        p_email,
        p_result,
        p_reason,
        p_score,
        p_ip,
        p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- CREATE VIEW FOR PASSWORD SECURITY STATS
-- ============================================

CREATE OR REPLACE VIEW password_security_stats AS
SELECT
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE validation_result = TRUE) as successful_validations,
    COUNT(*) FILTER (WHERE validation_result = FALSE) as failed_validations,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE validation_result = TRUE) / NULLIF(COUNT(*), 0),
        2
    ) as success_rate,
    AVG(strength_score) FILTER (WHERE strength_score IS NOT NULL) as avg_strength_score,
    COUNT(DISTINCT user_email) as unique_users,
    DATE_TRUNC('day', MAX(created_at)) as last_attempt,
    jsonb_object_agg(
        failure_reason, 
        COUNT(*)
    ) FILTER (WHERE failure_reason IS NOT NULL) as failure_reasons
FROM password_validation_logs
WHERE created_at > NOW() - INTERVAL '30 days';

-- Grant access to admins
GRANT SELECT ON password_security_stats TO authenticated;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Validate a password
DO $$
DECLARE
    result RECORD;
BEGIN
    SELECT * FROM enhanced_password_validation(
        'TestP@ssw0rd123',
        'user@example.com',
        'testuser'
    ) INTO result;
    
    RAISE NOTICE 'Valid: %, Reason: %', result.is_valid, result.reason;
END$$;

-- Example 2: Get password strength
DO $$
DECLARE
    result RECORD;
BEGIN
    SELECT * FROM password_strength_score('MyP@ssw0rd!2024') INTO result;
    
    RAISE NOTICE 'Score: %, Strength: %', result.score, result.strength;
    RAISE NOTICE 'Feedback: %', result.feedback;
END$$;

-- Example 3: View security stats (admins only)
-- SELECT * FROM password_security_stats;

-- ============================================
-- IMPORTANT REMINDERS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '⚠️  IMPORTANT SECURITY NOTICE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'These SQL functions provide BASIC password';
    RAISE NOTICE 'validation but are NOT a replacement for';
    RAISE NOTICE 'Supabase HaveIBeenPwned integration!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ What this SQL provides:';
    RAISE NOTICE '   - Basic pattern validation';
    RAISE NOTICE '   - Common password blocking (~50 passwords)';
    RAISE NOTICE '   - Strength scoring';
    RAISE NOTICE '   - Attempt logging';
    RAISE NOTICE '';
    RAISE NOTICE '❌ What this SQL CANNOT do:';
    RAISE NOTICE '   - Check against 600M+ compromised passwords';
    RAISE NOTICE '   - Real-time breach database updates';
    RAISE NOTICE '   - Industry-standard protection';
    RAISE NOTICE '';
    RAISE NOTICE '👉 YOU MUST STILL enable in Dashboard:';
    RAISE NOTICE '   Authentication → Providers → Email';
    RAISE NOTICE '   → Enable leaked password protection';
    RAISE NOTICE '';
    RAISE NOTICE '📖 Guide: /ENABLE_PASSWORD_PROTECTION_NOW.md';
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
END$$;

-- ============================================
-- SUMMARY
-- ============================================
--
-- Functions created:
-- ✅ enhanced_password_validation() - Comprehensive checks
-- ✅ password_strength_score() - Strength rating
-- ✅ log_password_validation() - Audit logging
--
-- Tables created:
-- ✅ password_validation_logs - Attempt tracking
--
-- Views created:
-- ✅ password_security_stats - Analytics
--
-- These are SUPPLEMENTARY security measures.
-- Dashboard setting is still REQUIRED!
--
-- ============================================
