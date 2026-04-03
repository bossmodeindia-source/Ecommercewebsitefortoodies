# ⚡ ADMIN LOGIN - QUICK FIX

## ❌ Error: "Invalid credentials"

### ✅ SOLUTION (30 seconds):

**1. Check Your Password - It's CASE-SENSITIVE!**

```
❌ WRONG: 9886510858@tcbtoponeadmin
❌ WRONG: 9886510858@TCBTOPONEADMIN
✅ CORRECT: 9886510858@TcbToponeAdmin
```

**The "T", "A" in Admin must be CAPITAL!**

---

**2. Check Your Email:**

```
✅ CORRECT: m78787531@gmail.com
```

---

**3. Clear Browser Data (If still failing):**

Press `F12` → Console tab → Type this:

```javascript
localStorage.clear();
```

Then refresh and try again.

---

**4. Check Browser Console for Debug Info:**

Press `F12` → Console tab → Look for:

```
Password match: true or false?
Email match: true or false?
```

If either is `false`, you're typing the wrong credentials!

---

## 🔧 EMERGENCY BYPASS

If nothing works, paste this in browser console (F12):

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

Then refresh the page (F5).

---

## 📖 Full Troubleshooting

See: [ADMIN_LOGIN_TROUBLESHOOTING.md](ADMIN_LOGIN_TROUBLESHOOTING.md)

---

**Most common issue: Password is case-sensitive!** 🔤
