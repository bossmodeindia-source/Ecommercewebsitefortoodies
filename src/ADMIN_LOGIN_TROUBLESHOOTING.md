# 🔧 ADMIN LOGIN TROUBLESHOOTING GUIDE

## ❌ Error: "Invalid credentials. Please check your email and password."

This error appears when **BOTH** login methods fail:
1. Supabase Auth (database login)
2. Bypass mode (hardcoded credentials)

---

## 🎯 SOLUTION 1: Check Credentials (Most Common)

### ✅ Correct Credentials:
```
Email: m78787531@gmail.com
Password: 9886510858@TcbToponeAdmin
```

### ⚠️ Common Mistakes:

**Password is CASE-SENSITIVE:**
- ✅ Correct: `9886510858@TcbToponeAdmin`
- ❌ Wrong: `9886510858@tcbtoponeadmin` (lowercase)
- ❌ Wrong: `9886510858@TCBTOPONEADMIN` (uppercase)

**Email must be exact:**
- ✅ Correct: `m78787531@gmail.com`
- ❌ Wrong: `M78787531@gmail.com` (capital M)
- ❌ Wrong: `m78787531 @gmail.com` (space)
- ❌ Wrong: `m78787531@gmail.com ` (trailing space)

**Copy/Paste Issues:**
- Copying from documents may include hidden characters
- Type manually to be 100% sure
- Check for spaces before/after

---

## 🎯 SOLUTION 2: Check Browser Console

Open browser Developer Tools (F12) and check the Console tab for detailed logs.

### Expected Success Logs:
```
🔐 ===== ADMIN LOGIN =====
Email: m78787531@gmail.com
🔑 Trying Supabase Auth...
⚠️ Supabase Auth unavailable or wrong creds — trying bypass...
🔓 Attempting credential bypass...
🔍 Debug credentials:
   Entered email: "m78787531@gmail.com"
   Expected email: "m78787531@gmail.com"
   Email trimmed: "m78787531@gmail.com"
   Email match: true
   Password length: 25
   Expected password length: 25
   Password match: true
✅ Bypass admin login granted
✅ Admin bypass session stored
===== END LOGIN =====
```

### What to Check:
1. **Email match:** Should be `true`
2. **Password length:** Should be `25` (both entered and expected)
3. **Password match:** Should be `true`

If any of these are `false`, you're entering the wrong credentials!

---

## 🎯 SOLUTION 3: Clear Browser Data

Sometimes localStorage gets corrupted. Clear it and try again.

### Method 1: Browser Console
```javascript
localStorage.clear();
// Then refresh the page and try logging in again
```

### Method 2: Browser Settings
1. Press `F12` to open Developer Tools
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Find "Local Storage" in the left sidebar
4. Right-click → "Clear"
5. Refresh the page

---

## 🎯 SOLUTION 4: Manual Bypass (Emergency)

If nothing else works, manually set localStorage:

### Step 1: Open Browser Console (F12)
```javascript
localStorage.setItem('toodies_access_token', 'bypass-admin-emergency');
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
```

### Step 2: Refresh Page
Press `F5` or `Ctrl+R` to refresh. You should now be logged in.

---

## 🎯 SOLUTION 5: Create Admin in Supabase (Optional)

For production use, create the admin account in Supabase Auth.

### Step 1: Go to Supabase Dashboard
```
https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/auth/users
```

### Step 2: Click "Add User" (top right)

### Step 3: Fill in Details
- **Email:** `m78787531@gmail.com`
- **Password:** `9886510858@TcbToponeAdmin`
- **Auto Confirm User:** Toggle ON (important!)

### Step 4: Click "Create User"

### Step 5: Get the User ID
After creation, you'll see the user in the list. Copy the UUID (looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 6: Run SQL in Supabase SQL Editor
```sql
-- Replace 'PASTE_UUID_HERE' with the actual UUID
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
  'PASTE_UUID_HERE',  -- ← Replace this!
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
```

### Step 7: Verify
```sql
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
```

You should see one row with role = 'admin'.

### Step 8: Try Login Again
Now login should work via Supabase Auth (primary method).

---

## 🔍 DEBUGGING CHECKLIST

### 1. Verify Credentials
- [ ] Email is exactly: `m78787531@gmail.com`
- [ ] Password is exactly: `9886510858@TcbToponeAdmin`
- [ ] No spaces before/after
- [ ] Password is case-sensitive
- [ ] Typed manually (not copy/pasted)

### 2. Check Browser Console
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Look for "Email match: true"
- [ ] Look for "Password match: true"
- [ ] Look for "Password length: 25"

### 3. Check Network
- [ ] Internet connection working
- [ ] Supabase project not paused
- [ ] No CORS errors in console

### 4. Try Fixes
- [ ] Clear localStorage
- [ ] Clear browser cache
- [ ] Try different browser
- [ ] Try incognito/private mode
- [ ] Try manual bypass (Solution 4)

---

## 📊 UNDERSTAND THE LOGIN FLOW

```
User enters credentials
        ↓
┌───────────────────────────────┐
│ 1. Try Supabase Auth          │
│    (Database login)           │
└───────────────────────────────┘
        ↓
    Success? ✅
        ↓ No
┌───────────────────────────────┐
│ 2. Try Bypass Mode            │
│    (Hardcoded credentials)    │
└───────────────────────────────┘
        ↓
    Success? ✅
        ↓ No
┌───────────────────────────────┐
│ ❌ Show Error                 │
│ "Invalid credentials"         │
└───────────────────────────────┘
```

**The bypass works WITHOUT Supabase!**
- No database account needed
- Works offline
- Hardcoded in the app

**If bypass fails, credentials are wrong!**

---

## 🆘 STILL NOT WORKING?

### Check These Files:
1. `/utils/supabaseApi.ts` - Line 195-196 (hardcoded credentials)
2. Browser console - Detailed debug logs
3. Network tab - Any failed requests?

### Last Resort:
Run this in browser console to see what's being compared:

```javascript
// Check what's in the code
console.log('Expected email:', 'm78787531@gmail.com');
console.log('Expected password:', '9886510858@TcbToponeAdmin');

// Check what localStorage has
console.log('Stored user:', localStorage.getItem('toodies_user'));
console.log('Stored token:', localStorage.getItem('toodies_access_token'));
```

---

## ✅ SUCCESS INDICATORS

You know login worked when you see:
1. ✅ No error message
2. ✅ "Verifying..." button appears
3. ✅ Redirects to admin dashboard
4. ✅ Console shows "✅ Admin bypass session stored"
5. ✅ localStorage has `toodies_user` and `toodies_access_token`

---

## 📖 Related Files

- `/database/CREATE_ADMIN_ACCOUNT.sql` - How to create admin in Supabase
- `/utils/supabaseApi.ts` - Login logic (lines 190-269)
- `/components/AdminLogin.tsx` - Login UI

---

## 💡 TIP: Use the Bypass!

**You don't need to create a Supabase account!**

The bypass mode is designed to work WITHOUT any database setup:
- ✅ Works immediately
- ✅ No SQL required
- ✅ No Supabase configuration needed
- ✅ Just enter the correct credentials

**If bypass fails, you're typing the wrong credentials!**

Check the browser console debug logs to see exactly what's being compared.

---

**The most common issue is typos in the password (it's case-sensitive!)** 🔤
