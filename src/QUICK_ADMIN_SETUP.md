# ⚡ Quick Setup - Admin Login (2 Minutes)

## ⚠️ IMPORTANT: Understanding User IDs

**The UUID you see (like `28455520-9eda-4785-821d-95be851dc72a`) is CORRECT!**

Supabase automatically assigns a unique UUID to every user. This is normal and expected. Your admin user will be identified by this UUID, not by the email.

---

## Step 1: Create Admin User (1 minute)

1. Open your **Supabase Dashboard**
2. Go to **Authentication** → **Users**
3. Click **"Add User"**
4. Fill in:
   - Email: `m78787531@gmail.com`
   - Password: `9886510858@TcbToponeAdmin`
   - ✅ Check "Auto Confirm User"
5. Click **"Create User"**

## Step 2: Set Admin Role (30 seconds)

1. Go to **SQL Editor** in Supabase
2. Copy this SQL and run it:

```sql
-- Update user to admin role
UPDATE users 
SET role = 'admin', 
    is_verified = true,
    full_name = 'Admin'
WHERE email = 'm78787531@gmail.com';

-- Verify admin was created
SELECT email, role, is_verified FROM users WHERE email = 'm78787531@gmail.com';
```

## Step 3: Test Login (30 seconds)

1. Go to your Toodies website
2. Click **"Admin"** in the navigation bar
3. Enter:
   - Email: `m78787531@gmail.com`
   - Password: `9886510858@TcbToponeAdmin`
4. Click **"Access Dashboard"**

## ✅ Done!

Your admin login is now secure and working!

---

## 🆘 Quick Troubleshooting

**"Invalid credentials"** → User doesn't exist. Repeat Step 1.

**"User profile not found"** → Run this SQL:
```sql
INSERT INTO users (id, email, full_name, role, is_verified)
SELECT id, email, 'Admin', 'admin', true
FROM auth.users
WHERE email = 'm78787531@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

**"Access denied"** → Run Step 2 again.

---

📖 **Full Documentation**: See `/SECURE_ADMIN_AUTH.md` for detailed information.