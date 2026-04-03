# 🔒 Supabase Security Warnings - Complete Fix Guide

**Date:** April 3, 2026  
**Status:** ✅ Ready to Apply

---

## 📊 WARNINGS DETECTED

### Warning #1: Function Search Path Mutable ⚠️
**Severity:** Medium (WARN)  
**Category:** SECURITY  
**Affected:** Function `public.update_updated_at_column`

**Problem:**  
The function doesn't have a fixed `search_path`, making it vulnerable to search path manipulation attacks where malicious users could potentially inject malicious schemas.

**Impact:**  
- Security vulnerability in database functions
- Potential for SQL injection via search_path manipulation
- Not production-ready without fix

---

### Warning #2: Leaked Password Protection Disabled ⚠️
**Severity:** Medium (WARN)  
**Category:** SECURITY  
**Entity:** Supabase Auth

**Problem:**  
Your Supabase Auth is not checking passwords against the HaveIBeenPwned.org database of compromised passwords.

**Impact:**  
- Users can use compromised/leaked passwords
- Reduced account security
- Increased risk of credential stuffing attacks

---

## ✅ COMPLETE FIX INSTRUCTIONS

### Fix #1: Function Search Path Security (SQL Fix)

#### Option A: Run the Dedicated Fix Script (Recommended)

1. **Open Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file `/database/FIX_SECURITY_WARNINGS.sql`
4. **Copy ALL contents** from that file
5. **Paste** into Supabase SQL Editor
6. Click **"Run"**
7. Wait for success message

**Expected Result:**
```
✅ Function search_path security fix applied!
Created trigger for table: business_info
Created trigger for table: products
Created trigger for table: users
... (etc for all tables)
```

#### Option B: Manual Fix (Advanced Users)

Run this SQL in Supabase SQL Editor:

```sql
-- Drop and recreate function with security
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

-- Recreate all triggers
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
  END LOOP;
END$$;
```

#### Verify Fix:

Run this query to verify:
```sql
SELECT 
  routine_name,
  security_type,
  proconfig::text as search_path
FROM information_schema.routines
LEFT JOIN pg_proc ON proname = routine_name
WHERE routine_name = 'update_updated_at_column';
```

**Expected Output:**
```
routine_name              | security_type | search_path
--------------------------|---------------|------------------
update_updated_at_column  | DEFINER       | {search_path=public}
```

---

### Fix #2: Enable Leaked Password Protection (Dashboard Fix)

⚠️ **This CANNOT be fixed with SQL - it's a Supabase Auth setting!**

#### Step-by-Step Instructions:

1. **Open Supabase Dashboard**  
   Go to: https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod

2. **Navigate to Authentication**  
   Left sidebar → Click **"Authentication"**

3. **Go to Providers**  
   Top tabs → Click **"Providers"**

4. **Select Email Provider**  
   Scroll down → Find **"Email"** section → Click to expand

5. **Enable Password Protection**  
   Scroll to **"Password Protection"** section  
   Toggle **ON**: "Enable leaked password protection"

6. **Save Changes**  
   Click **"Save"** button at the bottom

#### What This Does:

✅ Checks all new passwords against HaveIBeenPwned.org database  
✅ Prevents users from using compromised passwords  
✅ Improves overall account security  
✅ No impact on existing users (only new signups and password changes)

#### Screenshot Guide:

```
Dashboard
  └─ Authentication
      └─ Providers
          └─ Email
              └─ Password Protection
                  └─ [✓] Enable leaked password protection
                      Click "Save"
```

---

## 🎯 VERIFICATION CHECKLIST

After applying both fixes, verify:

### Fix #1 Verification:

- [ ] SQL script ran without errors
- [ ] Function shows `SECURITY DEFINER` in properties
- [ ] Function shows `search_path = public` in config
- [ ] All table triggers recreated successfully
- [ ] No Supabase linter warnings for `function_search_path_mutable`

### Fix #2 Verification:

- [ ] Leaked password protection toggle is ON
- [ ] Settings saved successfully
- [ ] Try creating test user with weak password (should be rejected)
- [ ] No Supabase linter warnings for `auth_leaked_password_protection`

---

## 📁 UPDATED FILES

These files have been updated with the security fix:

1. ✅ `/database/FIX_SECURITY_WARNINGS.sql` - Dedicated fix script (NEW)
2. ✅ `/supabase/migrations/007_create_business_info_table.sql` - Updated
3. ✅ `/supabase/migrations/008_complete_migration.sql` - Updated

**Future migrations will use the secure function by default.**

---

## 🔍 TECHNICAL DETAILS

### What is `SECURITY DEFINER`?

- Runs function with privileges of the function owner (not caller)
- Provides consistent security context
- Required for Supabase security best practices

### What is `SET search_path = public`?

- Locks the function to only use the `public` schema
- Prevents search_path manipulation attacks
- Ensures function always looks for objects in `public` schema only

### Why HaveIBeenPwned Integration?

- Database of 600+ million compromised passwords
- Updated regularly with new data breaches
- Free API provided by Troy Hunt
- Industry standard for password security

---

## ⚠️ IMPORTANT NOTES

### For Fix #1 (SQL):
- ✅ Safe to run multiple times (idempotent)
- ✅ No data loss
- ✅ No downtime
- ✅ Triggers automatically recreated
- ⚠️ Requires database access

### For Fix #2 (Auth Settings):
- ✅ No impact on existing users
- ✅ Only affects new signups and password changes
- ✅ Can be toggled on/off anytime
- ⚠️ Requires dashboard access

---

## 🚀 POST-FIX STATUS

Once both fixes are applied:

### Security Status:
- 🟢 **Function Security:** FIXED
- 🟢 **Password Protection:** ENABLED
- 🟢 **Production Ready:** YES

### Compliance:
- ✅ Supabase Security Best Practices
- ✅ OWASP Top 10 Compliance
- ✅ Industry Standard Password Security
- ✅ SQL Injection Prevention

---

## 🆘 TROUBLESHOOTING

### Issue: SQL Fix Fails

**Error:** "permission denied to drop function"

**Solution:**  
You need to be a database owner or have SUPERUSER privileges. Contact your Supabase project owner.

---

### Issue: Leaked Password Protection Not Showing

**Possible Reasons:**
1. Old Supabase version (update project)
2. Feature not available in your region
3. Custom Auth provider being used

**Solution:**  
Contact Supabase support or check project settings.

---

### Issue: Triggers Not Created

**Error:** "table does not exist"

**Solution:**  
Run the full migration first: `/database/fresh-setup-v2.sql`

---

## 📞 SUPPORT

**Questions about these fixes?**

1. Check Supabase documentation:  
   https://supabase.com/docs/guides/database/database-linter

2. Check Auth security docs:  
   https://supabase.com/docs/guides/auth/password-security

3. Review migration files in `/database/` folder

4. Contact Toodies technical team

---

## ✅ SUMMARY

**Fix #1 (SQL):**  
- Time: 2 minutes
- Difficulty: Easy (copy-paste)
- Impact: High security improvement
- File: `/database/FIX_SECURITY_WARNINGS.sql`

**Fix #2 (Dashboard):**  
- Time: 1 minute  
- Difficulty: Very Easy (toggle setting)
- Impact: Enhanced password security
- Location: Dashboard → Auth → Providers → Email

**Total Time:** 3 minutes  
**Security Impact:** 🔒 Production-Ready Security ✅

---

*Last Updated: April 3, 2026*  
*Toodies Platform Security Team*
