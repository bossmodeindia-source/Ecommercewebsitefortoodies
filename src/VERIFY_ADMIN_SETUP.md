# ✅ Verify Admin Setup - Troubleshooting Guide

## Understanding Supabase User IDs

**The UUID `28455520-9eda-4785-821d-95be851dc72a` is CORRECT and EXPECTED!**

Supabase Auth automatically generates a unique UUID for every user. This is the proper way Supabase identifies users in the system.

---

## Step-by-Step Verification

### 1️⃣ Check Supabase Auth (Authentication Tab)

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. You should see a user with:
   - ✅ Email: `m78787531@gmail.com`
   - ✅ ID: `28455520-9eda-4785-821d-95be851dc72a` (or similar UUID)
   - ✅ Status: Confirmed ✓

**This is correct!** The UUID is your admin's user ID.

---

### 2️⃣ Check Public Users Table (Database Tab)

Now we need to verify that your `users` table (in the public schema) has the admin role set correctly.

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query:

```sql
-- Check if admin exists in users table
SELECT 
  id,
  email,
  full_name,
  role,
  is_verified,
  created_at
FROM users 
WHERE email = 'm78787531@gmail.com';
```

**Expected Result:**
```
id: 28455520-9eda-4785-821d-95be851dc72a
email: m78787531@gmail.com
full_name: Admin
role: admin          👈 MOST IMPORTANT!
is_verified: true
created_at: [timestamp]
```

---

### 3️⃣ If Admin User Does NOT Exist in Users Table

If the above query returns **no rows**, it means the user profile wasn't created automatically. Fix it with:

```sql
-- Create admin user profile manually
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
SET role = 'admin', 
    is_verified = true,
    full_name = 'Admin';
```

Then verify again:

```sql
SELECT id, email, role FROM users WHERE email = 'm78787531@gmail.com';
```

You should now see the admin user with `role = 'admin'`.

---

### 4️⃣ If Role is NOT 'admin'

If the user exists but the role is wrong (e.g., 'customer' or null), fix it:

```sql
-- Force update to admin role
UPDATE users 
SET 
  role = 'admin',
  is_verified = true,
  full_name = 'Admin'
WHERE email = 'm78787531@gmail.com';

-- Verify
SELECT email, role, is_verified FROM users WHERE email = 'm78787531@gmail.com';
```

---

### 5️⃣ Test Admin Login

Now test the login:

1. Go to your **Toodies website**
2. Click **"Admin"** in the navigation
3. Enter:
   - Email: `m78787531@gmail.com`
   - Password: `9886510858@TcbToponeAdmin`
4. Click **"Access Dashboard"**

**Expected behavior:**
- ✅ Login successful
- ✅ Redirected to Admin Dashboard
- ✅ Can see orders, designs, settings, etc.

---

## Common Issues & Solutions

### Issue: "Invalid credentials"

**Cause:** Password is incorrect or user doesn't exist in Supabase Auth.

**Solution:**
1. Go to **Authentication** → **Users** in Supabase
2. Delete the user if exists
3. Click **Add User**
4. Email: `m78787531@gmail.com`
5. Password: `9886510858@TcbToponeAdmin`
6. ✅ Check "Auto Confirm User"
7. Click **Create User**
8. Then run Step 3️⃣ SQL from above

---

### Issue: "User profile not found"

**Cause:** User exists in `auth.users` but not in `public.users` table.

**Solution:** Run Step 3️⃣ SQL above to create the profile.

---

### Issue: "Access denied - Admin privileges required"

**Cause:** User profile exists but role is not 'admin'.

**Solution:** Run Step 4️⃣ SQL above to set role to admin.

---

### Issue: User ID is a UUID instead of email

**This is NORMAL!** ✅

Supabase uses UUIDs for user IDs. The email is stored separately as a field. This is the correct and secure way to identify users.

Your admin user will have:
- **ID (UUID)**: `28455520-9eda-4785-821d-95be851dc72a` ← Primary identifier
- **Email**: `m78787531@gmail.com` ← Login credential
- **Role**: `admin` ← Permission level

---

## Final Verification Checklist

Run this complete verification query:

```sql
-- Complete Admin Verification
SELECT 
  'auth.users' as table_name,
  u.id,
  u.email,
  u.email_confirmed_at,
  NULL as role
FROM auth.users u
WHERE u.email = 'm78787531@gmail.com'

UNION ALL

SELECT 
  'public.users' as table_name,
  p.id,
  p.email,
  NULL as email_confirmed_at,
  p.role
FROM users p
WHERE p.email = 'm78787531@gmail.com';
```

**Expected Result (2 rows):**

| table_name | id | email | email_confirmed_at | role |
|------------|----|----|---------------------|------|
| auth.users | 28455520-... | m78787531@gmail.com | 2024-... | NULL |
| public.users | 28455520-... | m78787531@gmail.com | NULL | **admin** |

✅ **Both rows should have the SAME ID (UUID)**  
✅ **public.users row should have role = 'admin'**

---

## Still Having Issues?

If you've followed all steps and still can't login:

1. **Check browser console** (F12) for error messages
2. **Clear browser cache** and localStorage:
   ```javascript
   // Run in browser console
   localStorage.clear();
   location.reload();
   ```
3. **Verify Supabase connection** - check console for connection errors
4. **Check RLS policies** - ensure they allow admin access

---

## Understanding the System

### How Admin Authentication Works:

1. **Supabase Auth** (`auth.users`):
   - Handles password verification
   - Generates and validates JWT tokens
   - Stores email and hashed password

2. **Public Users Table** (`public.users`):
   - Stores user profile data
   - Defines user role (admin/customer)
   - Links to auth user via matching UUID

3. **Login Process**:
   ```
   1. Enter email + password
   2. Supabase Auth validates credentials ✓
   3. Returns auth user with UUID
   4. App queries public.users table for role
   5. Checks if role === 'admin' ✓
   6. Grants admin access ✓
   ```

---

## Success!

If you can now login as admin, you're all set! 🎉

The UUID is perfectly normal and shows that your Supabase setup is working correctly.
