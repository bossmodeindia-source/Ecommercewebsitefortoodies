# 🚀 Toodies Database Setup Instructions

## ❌ Current Error
```
Database tables not found
```

## ✅ How to Fix (5 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: **https://supabase.com/dashboard/project/mvehfbmjtycgnzahffod/sql**
2. Click the **"New Query"** button

### Step 2: Copy the SQL Script
1. Open the file: `/database/fresh-setup-v2.sql` (in this project)
2. **Copy ALL the SQL code** (lines 1-671)

### Step 3: Paste and Run
1. **Paste** the SQL into the Supabase SQL Editor
2. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
3. Wait ~10-15 seconds for completion

### Step 4: Verify Success
You should see:
```
✅ Toodies database FRESH setup complete! All 20 tables created with RLS policies and auto-trigger for admin user.
```

### Step 5: Refresh Your App
1. Go back to your Toodies app
2. **Refresh the page** (F5 or Cmd+R)
3. The error should be gone! ✅

---

## 📋 What This Script Does

### Creates 20 Tables:
1. ✅ `users` - User accounts (extends Supabase Auth)
2. ✅ `categories` - Product categories
3. ✅ `products` - Product catalog
4. ✅ `product_variations` - Sizes, colors, SKUs
5. ✅ `printing_methods` - Custom printing options
6. ✅ `saved_customer_designs` - 2D Studio designs with approval workflow
7. ✅ `cart_items` - Shopping cart
8. ✅ `orders` - Order management
9. ✅ `order_items` - Order line items
10. ✅ `coupons` - Discount codes
11. ✅ `business_info` - Store settings
12. ✅ `admin_settings` - Admin panel config
13. ✅ `ai_config` - Paperspace API settings
14. ✅ `three_d_model_configs` - 3D viewer configs
15. ✅ `message_templates` - Email/SMS templates
16. ✅ `help_articles` - Help center content
17. ✅ `popup_messages` - Notification popups
18. ✅ `invoices` - Invoice generation
19. ✅ `invoice_items` - Invoice line items
20. ✅ `chat_conversations` - Customer support chat
21. ✅ `chat_messages` - Chat messages

### Sets Up Security:
- ✅ Row Level Security (RLS) policies on all tables
- ✅ Admin detection function (`is_admin()`)
- ✅ Auto-trigger to create user profiles on signup
- ✅ Auto-admin assignment for `m78787531@gmail.com`

### Creates Indexes:
- ✅ Optimized queries for products, orders, designs

---

## 🔐 Admin Account

After running the script, create your admin account:

1. **Go to**: Your Toodies app login page
2. **Sign up** with:
   - Email: `m78787531@gmail.com`
   - Password: `9886510858@TcbToponeAdmin`
3. The trigger will **automatically assign admin role**

---

## 🆘 Troubleshooting

### "relation already exists" error:
The script includes `DROP TABLE IF EXISTS` - this is normal if tables already exist. The script will recreate them cleanly.

### "permission denied" error:
Make sure you're running the SQL in the **Supabase SQL Editor**, not your local terminal.

### Still seeing errors after running?
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Check Supabase project is not paused
4. Verify all 671 lines were copied correctly

---

## 📞 Need Help?

If you encounter issues:
1. Check the browser console (F12 → Console)
2. Look for specific error messages
3. Make sure your Supabase project is active (not paused)

---

**Last Updated**: Architecture V2 (Production-Ready with Supabase Only)
