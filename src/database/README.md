# 🗄️ Toodies Database Setup

## Quick Start

### For New Installations
Run this file in Supabase SQL Editor:
```
fresh-setup-v2.sql
```

### For Existing Databases (URGENT FIX)
If you already have a database but need to fix the 6 critical errors:
```
URGENT_FIX_MIGRATION.sql
```

---

## 📁 Files Overview

### `fresh-setup-v2.sql`
**Purpose:** Complete database setup from scratch  
**When to use:** New Supabase projects or complete database reset  
**What it does:**
- Drops ALL existing tables (if any)
- Creates all 20+ tables with correct structure
- Sets up Row Level Security (RLS) policies
- Configures triggers for auto-updates
- Inserts default data (business info, admin settings, etc.)

### `FIX_SECURITY_WARNINGS.sql` ⭐
**Purpose:** Fix Supabase security linter warnings  
**When to use:** After seeing security warnings in Supabase Dashboard  
**What it does:**
- Fixes function search_path security vulnerability
- Adds SECURITY DEFINER and SET search_path to functions
- Recreates all triggers with secure configuration

**📖 Documentation:** `/SECURITY_WARNINGS_FIX_GUIDE.md` and `/DO_THIS_NOW.md`

### `PASSWORD_PROTECTION_INFO.sql` ℹ️
**Purpose:** Explains why SQL cannot enable password protection  
**When to use:** Understanding password security architecture  
**What it does:**
- Explains Auth API vs Database architecture
- Shows what IS and ISN'T possible with SQL
- Provides verification queries

**📖 Explanation:** `/SQL_EXPLANATION_PASSWORD_PROTECTION.md`

### `SQL_PASSWORD_WORKAROUNDS.sql` 🛡️ (Optional)
**Purpose:** Basic password validation functions  
**When to use:** For additional validation (NOT a replacement for dashboard!)  
**What it does:**
- Creates enhanced_password_validation() function
- Creates password_strength_score() function
- Sets up password attempt logging

⚠️ **Important:** This is NOT a replacement for dashboard setting!

### `COPY_PASTE_FIX.sql`
**Purpose:** Quick admin account setup  
**When to use:** Creating admin user for the first time  
**What it does:**
- Creates/updates admin profile in users table
- Sets correct role and permissions
- Single copy-paste solution

### `CREATE_ADMIN_ACCOUNT.sql` 🆕
**Purpose:** Step-by-step admin account creation guide  
**When to use:** If admin login fails with "Invalid credentials"  
**What it does:**
- Instructions to create admin in Supabase Auth Dashboard
- SQL to link auth user to public.users table
- Troubleshooting and verification queries
- Emergency bypass method

**📖 Related Guides:** 
- `/ADMIN_LOGIN_QUICK_FIX.md` - Quick solutions
- `/ADMIN_LOGIN_TROUBLESHOOTING.md` - Complete troubleshooting

---

## 🚀 Setup Instructions

### Option 1: Fresh Installation

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   ```

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy & Paste**
   - Open `/database/fresh-setup-v2.sql`
   - Copy entire contents
   - Paste into Supabase SQL Editor

4. **Run**
   - Click "Run" button
   - Wait for success message
   - Check "Messages" panel for confirmation

5. **Verify**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   - Should see `saved_customer_designs` (not `customer_designs`)

---

### Option 2: Fix Existing Database

1. **Backup Your Data** (IMPORTANT!)
   ```sql
   -- Export existing designs if you have any
   SELECT * FROM customer_designs; -- or saved_customer_designs
   -- Save results to CSV
   ```

2. **Open Supabase SQL Editor**
   - Navigate to SQL Editor
   - Create new query

3. **Run Fix Migration**
   - Copy contents of `/database/URGENT_FIX_MIGRATION.sql`
   - Paste into SQL Editor
   - Click "Run"

4. **Check Success Messages**
   ```
   ✅ DATABASE FIX MIGRATION COMPLETE!
   ✓ Table renamed to saved_customer_designs
   ✓ Added gifting protocol fields
   ✓ Added admin approval workflow fields
   etc.
   ```

5. **Verify New Structure**
   ```sql
   -- Check table exists with correct name
   SELECT * FROM saved_customer_designs LIMIT 1;
   
   -- Check new columns exist
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'saved_customer_designs'
   ORDER BY column_name;
   ```

---

## 🔍 Verification Queries

### Check All Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check saved_customer_designs Structure
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'saved_customer_designs'
ORDER BY ordinal_position;
```

### Check RLS Policies
```sql
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE tablename = 'saved_customer_designs';
```

### Test Insert (as admin)
```sql
INSERT INTO saved_customer_designs (
  user_id,
  product_name,
  design_name,
  purchase_mode,
  neck_label_text,
  thank_you_card_text
) VALUES (
  auth.uid(),
  'Test T-Shirt',
  'Test Design',
  'gift',
  'Test Neck Label',
  'Test Thank You Message'
);
```

---

## 🛠️ Troubleshooting

### Error: "table already exists"
**Solution:** Run this first:
```sql
DROP TABLE IF EXISTS saved_customer_designs CASCADE;
```
Then run the migration again.

### Error: "infinite recursion detected"
**Problem:** RLS policy issue  
**Solution:** Disable and re-enable RLS:
```sql
ALTER TABLE saved_customer_designs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own designs" ON saved_customer_designs;
DROP POLICY IF EXISTS "Users create own designs" ON saved_customer_designs;
DROP POLICY IF EXISTS "Users update own designs" ON saved_customer_designs;
DROP POLICY IF EXISTS "Admin manage designs" ON saved_customer_designs;

ALTER TABLE saved_customer_designs ENABLE ROW LEVEL SECURITY;

-- Then recreate policies from the migration file
```

### Error: "column does not exist"
**Problem:** Migration didn't add all columns  
**Solution:** Drop table and run full migration:
```sql
DROP TABLE IF EXISTS saved_customer_designs CASCADE;
-- Then run URGENT_FIX_MIGRATION.sql again
```

### Foreign Key Errors
**Problem:** Other tables reference old table name  
**Solution:** Update constraints:
```sql
ALTER TABLE cart_items 
  DROP CONSTRAINT IF EXISTS cart_items_design_id_fkey;
ALTER TABLE cart_items 
  ADD CONSTRAINT cart_items_design_id_fkey 
  FOREIGN KEY (design_id) 
  REFERENCES saved_customer_designs(id) 
  ON DELETE SET NULL;
```

---

## 📊 Database Schema Overview

### Core Tables
- `users` - Customer and admin accounts
- `products` - Product catalog
- `categories` - Product categories
- `saved_customer_designs` ⭐ - Custom designs with approval workflow

### E-commerce Tables
- `cart_items` - Shopping cart
- `orders` - Order history
- `order_items` - Order line items
- `coupons` - Discount codes

### Configuration Tables
- `business_info` - Company details
- `admin_settings` - Platform settings
- `printing_methods` - Available printing options
- `billing_calculation_settings` - Tax and shipping

### Feature Tables
- `three_d_model_configs` - 3D model settings
- `gifting_templates` - Gift customization templates
- `message_templates` - Email/SMS templates
- `popup_messages` - Marketing popups
- `help_center` - FAQ articles
- `chat_conversations` - Customer support chats
- `ai_config` - AI chatbot settings

---

## 🔐 Security (RLS Policies)

### Public Read (No Auth Required)
- business_info
- products
- categories
- printing_methods
- help_center (active only)

### User-Specific (Own Data)
- saved_customer_designs (users see own, admin sees all)
- orders (users see own, admin sees all)
- cart_items (users manage own)

### Admin Only
- admin_settings
- ai_config
- three_d_model_configs
- message_templates

---

## 🎯 Next Steps After Setup

1. **Create Admin Account**
   - Use app's admin login: `m78787531@gmail.com` / `9886510858@TcbToponeAdmin`
   - Or manually insert into users table with role='admin'

2. **Configure Admin Settings**
   - Add Razorpay keys (payment gateway)
   - Add background removal API key
   - Set up email/SMS providers

3. **Add Products**
   - Use admin panel to add products
   - Upload 2D model images (1200×1200)
   - Configure pricing and variations

4. **Test Workflows**
   - Create design as customer
   - Submit for approval
   - Approve as admin with price override
   - Test payment flow

---

## 📞 Support

**Issues with database setup?**
1. Check Supabase logs: Dashboard → Logs
2. Verify project ID matches in code
3. Confirm you have editor access in Supabase
4. Check database quota (free tier limits)

**Admin Credentials:**
- Email: m78787531@gmail.com
- Password: 9886510858@TcbToponeAdmin

---

**Last Updated:** March 24, 2026  
**Database Version:** 2.0 (with 6 critical fixes)  
**Platform:** Toodies E-Commerce Platform