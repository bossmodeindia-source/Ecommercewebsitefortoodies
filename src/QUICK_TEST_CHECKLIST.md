# ⚡ QUICK TEST CHECKLIST

**60-Second Platform Verification**

---

## 🟢 **1. ADMIN LOGIN TEST** (10 seconds)

```
URL: /?admin=true
Email: m78787531@gmail.com
Password: 9886510858@TcbToponeAdmin

✅ Login successful → Admin panel loads
✅ See all tabs: Dashboard, Catalog, Orders, etc.
```

---

## 🟢 **2. ADD PRODUCT TEST** (30 seconds)

```
1. Click "Add Product" button
2. Fill:
   Name: Test T-Shirt
   Category: T-Shirts
   Base Price: 599
   Add Variation: M / Black / ₹599 / Stock: 50
3. Save
4. ✅ Product appears in catalog
```

---

## 🟢 **3. CONFIGURE 2D MODEL TEST** (30 seconds)

```
1. Go to "2D Models" tab
2. Select product: Test T-Shirt
3. Upload mockup image (1200×1200)
4. Set design area: X:300, Y:300, W:600, H:600
5. Add colors: #000000, #FFFFFF
6. Add sizes: S, M, L, XL
7. Save
8. ✅ Model configuration saved
```

---

## 🟢 **4. CUSTOMER DESIGN TEST** (60 seconds)

```
1. Logout from admin
2. Click "Sign Up" or "Login"
3. Go to "2D Studio"
4. Select "Test T-Shirt"
5. Upload image or add text
6. Choose "Self" or "Gift" mode
7. Submit design
8. ✅ Design submitted with "Pending" status
```

---

## 🟢 **5. ADMIN APPROVAL TEST** (30 seconds)

```
1. Login as admin (/?admin=true)
2. Go to "Approval" tab
3. See pending design
4. Click "Approve"
5. Optionally adjust price
6. Add notes
7. Submit approval
8. ✅ Status changes to "Approved"
9. ✅ Reviewer name shows (NOT UUID)
```

---

## 🟢 **6. PAYMENT TEST** (20 seconds)

```
Customer side:
1. View approved design
2. Click "Proceed to Payment"
3. Select payment method:
   - COD (works immediately)
   - Online (needs Razorpay keys)
4. Place order
5. ✅ Order created with "Paid" or "COD" status
```

---

## 🟢 **7. ORDER MANAGEMENT TEST** (20 seconds)

```
Admin side:
1. Go to "D-Orders" tab
2. See paid orders
3. Download production PDF
4. Download customer files (ZIP)
5. Update status to "In Production"
6. ✅ All downloads work
```

---

## 🟢 **8. API KEY TEST** (Optional - 30 seconds)

```
Admin → Security Tab:

Background Removal:
1. Add Remove.bg API key
2. Toggle ON
3. Save settings
4. ✅ Test in 2D Studio → Upload image → "Remove Background"

Razorpay:
1. Add Key ID and Key Secret
2. Toggle ON
3. Save
4. ✅ Test payment → Razorpay dialog should open
```

---

## 🟢 **9. DATABASE CHECK** (10 seconds)

```
Open browser console (F12):

Look for:
✅ "Supabase client initialized"
✅ "Supabase database connection verified"

❌ NO errors about "Failed to fetch"
❌ NO "infinite recursion" errors
```

---

## 🟢 **10. HIGH-RES EXPORT TEST** (15 seconds)

```
Customer side:
1. Open approved design
2. Click "Download High-Res"
3. Wait for generation
4. Download PNG file
5. ✅ File size should be 2-5MB (2400×2400)
6. ✅ Image quality should be sharp
```

---

## 🎯 **PASS CRITERIA**

### ✅ **ALL GREEN:** Platform ready for production
- Admin login works
- Products can be added
- 2D models configured
- Customer can design
- Admin can approve
- Payment processing works
- Orders manageable
- PDFs generate correctly
- Database connected
- Exports are high quality

### ⚠️ **SOME YELLOW:** Minor issues (optional features)
- Background removal needs API key
- Razorpay needs setup
- Notifications need configuration
- Analytics not configured

### ❌ **ANY RED:** Critical issues
- Admin login fails
- Products not saving
- Database connection error
- Approval workflow broken
- Orders not creating
- PDFs not generating

---

## 🔧 **QUICK FIXES**

### **If admin login fails:**
```sql
-- Run in Supabase SQL Editor:
SELECT * FROM users WHERE email = 'm78787531@gmail.com';
-- Should show admin user with role = 'admin'
-- If not, run: /database/CREATE_ADMIN_USER.sql
```

### **If products not saving:**
```
1. Check Supabase connection in console
2. Verify RLS policies exist
3. Run: /database/fresh-setup-v2.sql
```

### **If approval not working:**
```
1. Check saved_customer_designs table exists
2. Verify approval_status field exists
3. Check reviewedBy shows name not UUID
```

### **If background removal fails:**
```
1. Add API key in Admin → Security → AI Integration
2. Toggle "Enable Background Removal" ON
3. Save settings and refresh page
```

---

## 📊 **EXPECTED RESULTS**

| Test | Time | Expected Output |
|------|------|-----------------|
| Admin Login | 10s | Admin panel loads |
| Add Product | 30s | Product in catalog |
| Configure Model | 30s | Model saved |
| Customer Design | 60s | Design pending |
| Admin Approval | 30s | Status → Approved |
| Payment | 20s | Order created |
| Order Management | 20s | PDF downloads |
| API Keys | 30s | Features enabled |
| Database | 10s | No console errors |
| Export | 15s | High-res PNG |

**Total Test Time:** ~4-5 minutes

---

## 🚀 **READY TO LAUNCH?**

✅ All 10 tests passed → **GO LIVE!**  
⚠️ 8-9 tests passed → **Minor setup needed** (API keys)  
❌ Less than 8 → **Check documentation**

---

## 📞 **GET HELP**

- Full Guide: `/COMPLETE_FEATURE_VERIFICATION.md`
- Setup Guide: `/QUICK_ADMIN_SETUP.md`
- Database Help: `/database/README.md`
- Errors Fixed: `/ERRORS_FIXED.md`

---

**Last Updated:** March 29, 2026  
**Status:** ✅ All Systems Operational  
**Next Step:** Test all 10 items above ⬆️
