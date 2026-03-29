# 🔑 COMPLETE API KEYS SETUP GUIDE

**Get Your Toodies Platform Fully Powered**

---

## 📋 TABLE OF CONTENTS

1. [Background Removal API (Remove.bg)](#1-background-removal-api)
2. [Payment Gateway (Razorpay)](#2-payment-gateway-razorpay)
3. [WhatsApp Business API](#3-whatsapp-business-api)
4. [Email Services](#4-email-services)
5. [SMS Providers](#5-sms-providers)
6. [AI Image Generation](#6-ai-image-generation)
7. [Analytics & Tracking](#7-analytics--tracking)
8. [Priority Setup Order](#8-priority-setup-order)

---

## 1. BACKGROUND REMOVAL API

### **Service:** Remove.bg
### **Purpose:** Auto-remove backgrounds from uploaded images
### **Cost:** FREE - 50 API calls/month
### **Priority:** 🔥 HIGH (Most requested feature)

### **Step-by-Step Setup:**

#### **Step 1: Create Account**
1. Visit: https://www.remove.bg/users/sign_up
2. Sign up with email
3. Verify your email address
4. Login to dashboard

#### **Step 2: Get API Key**
1. Go to: https://www.remove.bg/api
2. Click "Get API Key" button
3. Copy your API key (starts with: `...`)
4. Save it securely

#### **Step 3: Add to Toodies**
1. Login to Admin Panel (`/?admin=true`)
2. Go to **Security** tab
3. Scroll to **"AI Integration"** section
4. Click **"Configure AI Providers"**
5. Find **"Background Removal"** card
6. Paste your API key
7. Toggle **"Enable Background Removal"** to ON
8. Click **"Save Settings"**

#### **Step 4: Test**
1. Logout from admin
2. Login as customer
3. Go to **2D Studio**
4. Select any product
5. Upload an image with background
6. Click **"Remove Background"** button
7. ✅ Background should disappear

#### **Troubleshooting:**
- **Error: "API key invalid"** → Copy key again, ensure no spaces
- **Error: "Credits exhausted"** → Free plan is 50/month, upgrade if needed
- **Error: "Failed to fetch"** → Check internet connection

#### **API Limits:**
- **Free:** 50 images/month
- **Subscription:** $9/month for 500 images
- **Pay-as-you-go:** $0.09 per image

---

## 2. PAYMENT GATEWAY (RAZORPAY)

### **Service:** Razorpay
### **Purpose:** Accept online payments (UPI, Cards, Net Banking)
### **Cost:** FREE account + 2% transaction fee
### **Priority:** 🔥 CRITICAL (Required for payments)

### **Step-by-Step Setup:**

#### **Step 1: Create Merchant Account**
1. Visit: https://dashboard.razorpay.com/signup
2. Sign up with business details:
   - Business name: Toodies
   - Business type: E-commerce
   - Email and phone
3. Complete KYC verification (required for live mode)
4. Account approved (usually 24-48 hours)

#### **Step 2: Get API Keys**

##### **For Testing (Immediate):**
1. Login to: https://dashboard.razorpay.com/
2. Go to **Settings** → **API Keys**
3. Click **"Generate Test Key"**
4. Copy both:
   - **Key ID** (starts with `rzp_test_...`)
   - **Key Secret** (starts with `...`)

##### **For Production (After KYC):**
1. Go to **Settings** → **API Keys**
2. Switch mode from "Test" to "Live"
3. Click **"Generate Live Key"**
4. Copy both:
   - **Key ID** (starts with `rzp_live_...`)
   - **Key Secret** (starts with `...`)

#### **Step 3: Add to Toodies**
1. Login to Admin Panel
2. Go to **Security** tab
3. Scroll to **"Payment Gateway Configuration"**
4. Enter **Razorpay Key ID**
5. Enter **Razorpay Key Secret**
6. Toggle **"Enable Razorpay"** to ON
7. Select payment methods to enable:
   - ✅ UPI (PhonePe, Google Pay, Paytm)
   - ✅ Cards (Credit/Debit)
   - ✅ Net Banking
   - ✅ Wallets
   - ✅ EMI (if needed)
8. Click **"Save Settings"**

#### **Step 4: Test Payment**
1. Create design as customer
2. Get admin approval
3. Click "Proceed to Payment"
4. Select Razorpay
5. Use **Test Card:**
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: Any future date
   - Name: Any name
6. ✅ Payment should succeed

#### **Important Notes:**
- **Test mode:** Use test keys, no real money charged
- **Live mode:** Real payments, requires KYC verification
- **Transaction fee:** Razorpay charges 2% + GST
- **Settlement:** Funds transferred to bank in 2-3 days
- **Webhooks:** Auto-configured for payment status updates

#### **Webhooks Setup (Advanced):**
1. Razorpay Dashboard → **Settings** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/razorpay-webhook`
3. Select events:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ order.paid
4. Copy webhook secret
5. Add to Admin Settings → Razorpay Webhook Secret

---

## 3. WHATSAPP BUSINESS API

### **Service:** WhatsApp Business Platform
### **Purpose:** Send order updates, approvals, notifications
### **Cost:** FREE setup + per-message charges (conversation-based pricing)
### **Priority:** 🟡 MEDIUM (Optional but recommended)

### **Step-by-Step Setup:**

#### **Step 1: Create Facebook Business Account**
1. Visit: https://business.facebook.com/
2. Create business account
3. Add business details
4. Verify business (may require documents)

#### **Step 2: Set Up WhatsApp Business**
1. Go to: https://business.facebook.com/wa/manage/home/
2. Click **"Create a WhatsApp Business Account"**
3. Add phone number (must not be registered on WhatsApp)
4. Verify phone with OTP
5. Complete setup wizard

#### **Step 3: Get API Credentials**
1. Go to: https://developers.facebook.com/
2. Create new app → Select "Business" type
3. Add **WhatsApp** product
4. Go to **WhatsApp** → **Getting Started**
5. Copy:
   - **Phone Number ID**
   - **WhatsApp Business Account ID**
6. Generate **Permanent Token**:
   - Go to **Settings** → **Business Settings**
   - System Users → Create system user
   - Assign WhatsApp permissions
   - Generate token
   - Copy **Access Token**

#### **Step 4: Add to Toodies**
1. Admin Panel → **Security** tab
2. Scroll to **"WhatsApp Configuration"**
3. Enter:
   - **Business Phone Number** (with country code, e.g., +91xxxxxxxxxx)
   - **Phone Number ID**
   - **Access Token**
4. Toggle **"Enable WhatsApp Notifications"** to ON
5. Click **"Save Settings"**

#### **Step 5: Configure Message Templates**
1. Go to Admin Panel → **Messages** tab
2. Create templates for:
   - Order confirmation
   - Design approval
   - Payment received
   - Order shipped
   - Order delivered
3. Submit templates for Facebook approval
4. Wait 24 hours for approval

#### **Step 6: Test**
1. Place a test order
2. Check customer receives WhatsApp message
3. Verify message format and content

#### **Pricing:**
- **Marketing conversations:** ~$0.05 per conversation
- **Utility conversations:** ~$0.02 per conversation
- **Service conversations:** Free (if customer messages first)
- **Free tier:** 1,000 conversations/month

---

## 4. EMAIL SERVICES

### **Option A: Gmail API (Recommended for small scale)**

#### **Setup Steps:**
1. Visit: https://console.cloud.google.com/
2. Create new project
3. Enable **Gmail API**
4. Create credentials → OAuth 2.0 Client ID
5. Download credentials JSON
6. Copy **Client ID** and **Client Secret**
7. Add to Toodies:
   - Admin → Security → Email Settings
   - Select "Gmail API"
   - Paste Client ID and Secret
   - Enable Email Notifications
   - Save

**Cost:** FREE - 100 emails/day

---

### **Option B: SMTP (Gmail/Outlook/Custom)**

#### **Gmail SMTP:**
1. Enable 2-Step Verification on Google account
2. Generate App Password:
   - Google Account → Security
   - App passwords → Generate new
   - Select "Mail" and "Other device"
   - Copy 16-character password
3. Add to Toodies:
   - Admin → Security → Email Settings
   - Select "SMTP"
   - Host: `smtp.gmail.com`
   - Port: `587` (or `465` for SSL)
   - Username: `your-email@gmail.com`
   - Password: (App Password)
   - Enable Email
   - Save

**Cost:** FREE - 500 emails/day

---

### **Option C: SendGrid (Recommended for scale)**

#### **Setup Steps:**
1. Visit: https://sendgrid.com/
2. Sign up (free plan: 100 emails/day)
3. Complete sender verification
4. Create API key
5. Add to Toodies:
   - Admin → Security → Email Settings
   - Select "SendGrid"
   - API Key: (paste key)
   - Enable Email
   - Save

**Cost:** 
- **Free:** 100 emails/day
- **Essentials:** $19.95/month for 50K emails

---

## 5. SMS PROVIDERS

### **Option A: Twilio (Most Popular)**

#### **Setup:**
1. Visit: https://www.twilio.com/try-twilio
2. Sign up (free trial: $15 credit)
3. Get phone number
4. Copy credentials:
   - Account SID
   - Auth Token
   - Twilio Phone Number
5. Add to Toodies:
   - Admin → Security → SMS Settings
   - Select "Twilio"
   - Paste credentials
   - Enable SMS
   - Save

**Cost:** ~$0.0075 per SMS (India)

---

### **Option B: MSG91 (India Specific)**

#### **Setup:**
1. Visit: https://msg91.com/
2. Sign up
3. Complete KYC
4. Copy:
   - Auth Key
   - Sender ID (6 characters, e.g., TOODES)
   - Template ID (after creating template)
5. Add to Toodies
6. Enable SMS

**Cost:** ~₹0.20 per SMS

---

### **Option C: AWS SNS (Enterprise)**

#### **Setup:**
1. Visit: https://aws.amazon.com/sns/
2. Create AWS account
3. Go to SNS console
4. Create topic
5. Copy:
   - Access Key ID
   - Secret Access Key
   - Region
6. Add to Toodies

**Cost:** $0.00645 per SMS (India)

---

## 6. AI IMAGE GENERATION

### **Kimi 2.5 (Moonshot AI)** - ✅ Pre-configured
- **Status:** Already active in Toodies
- **Purpose:** Text generation (not images)
- **Cost:** FREE with provided API key
- **No setup needed**

---

### **OpenAI DALL-E 3**

#### **Setup:**
1. Visit: https://platform.openai.com/signup
2. Create account
3. Add payment method (required)
4. Go to: https://platform.openai.com/api-keys
5. Click **"Create new secret key"**
6. Copy key (starts with `sk-...`)
7. Add to Toodies:
   - Admin → Security → AI Integration
   - Expand "OpenAI DALL-E 3"
   - Paste API key
   - Set active to ON
   - Save

**Cost:** 
- DALL-E 3: $0.04 per image (1024×1024)
- DALL-E 3 HD: $0.08 per image

---

### **Stability AI (SDXL)**

#### **Setup:**
1. Visit: https://platform.stability.ai/
2. Sign up
3. Add credits ($10 minimum)
4. Generate API key
5. Add to Toodies

**Cost:** $0.02 per image (1024×1024)

---

### **Replicate (Flux)**

#### **Setup:**
1. Visit: https://replicate.com/
2. Sign up
3. Go to: https://replicate.com/account/api-tokens
4. Create token
5. Add to Toodies

**Cost:** ~$0.003 per second of compute

---

## 7. ANALYTICS & TRACKING

### **Google Analytics**

#### **Setup:**
1. Visit: https://analytics.google.com/
2. Sign in with Google account
3. Click **"Start measuring"**
4. Create property:
   - Property name: Toodies
   - Time zone: India
   - Currency: INR
5. Set up data stream:
   - Platform: Web
   - Website URL: your-domain.com
   - Stream name: Toodies Website
6. Copy **Measurement ID** (starts with `G-...`)
7. Add to Toodies:
   - Admin → Security → Analytics
   - Paste Google Analytics ID
   - Enable Analytics
   - Save

**Cost:** FREE

---

### **Facebook Pixel**

#### **Setup:**
1. Visit: https://business.facebook.com/
2. Go to **Events Manager**
3. Click **"Connect Data Sources"** → **Web**
4. Select **"Facebook Pixel"**
5. Name your pixel: "Toodies Pixel"
6. Copy **Pixel ID** (16-digit number)
7. Add to Toodies:
   - Admin → Security → Analytics
   - Paste Facebook Pixel ID
   - Enable Pixel Tracking
   - Save

**Cost:** FREE

---

## 8. PRIORITY SETUP ORDER

### **🔴 Must Have (Start immediately):**
1. ✅ **Razorpay** - Accept payments
2. ✅ **Admin Account** - Already set up

### **🟡 Should Have (Within 1 week):**
3. ✅ **Remove.bg** - Background removal (50 free/month)
4. ✅ **Email (SMTP)** - Order confirmations (free)
5. ✅ **Google Analytics** - Track visitors (free)

### **🟢 Nice to Have (Optional):**
6. ✅ **WhatsApp** - Better customer communication
7. ✅ **SMS** - Additional notifications
8. ✅ **AI Images** - Design suggestions
9. ✅ **Facebook Pixel** - Ads tracking

---

## 🎯 QUICK SETUP (30 MINUTES)

### **Immediate Value Setup:**

1. **Razorpay (10 min):**
   - Sign up → Get test keys → Add to Toodies → Test payment ✅

2. **Remove.bg (5 min):**
   - Sign up → Copy API key → Add to Toodies → Test removal ✅

3. **Gmail SMTP (10 min):**
   - Generate app password → Add to Toodies → Send test email ✅

4. **Google Analytics (5 min):**
   - Create property → Copy ID → Add to Toodies ✅

**Total: 30 minutes**  
**Result: Fully functional payment + background removal + email + analytics**

---

## 📊 API COSTS COMPARISON

| Service | Free Tier | Paid Plans | Best For |
|---------|-----------|------------|----------|
| Remove.bg | 50/month | $9/month (500) | Background removal |
| Razorpay | ✅ Account free | 2% per transaction | Payments |
| WhatsApp | 1,000/month | $0.02-0.05/msg | Notifications |
| Gmail SMTP | 500/day | N/A | Email (small) |
| SendGrid | 100/day | $20/month (50K) | Email (scale) |
| Twilio SMS | $15 credit | ~$0.0075/SMS | SMS |
| Google Analytics | ✅ Free forever | N/A | Analytics |
| Facebook Pixel | ✅ Free forever | N/A | Ads tracking |

---

## ✅ VERIFICATION CHECKLIST

After setup, verify each service:

- [ ] Background Removal: Upload image → Click remove → Works
- [ ] Razorpay: Test payment → Razorpay opens → Payment succeeds
- [ ] Email: Place order → Check inbox → Email received
- [ ] WhatsApp: Place order → Check phone → Message received
- [ ] SMS: Enable SMS → Test → SMS received
- [ ] Analytics: Visit site → Check GA dashboard → Data showing
- [ ] Facebook Pixel: Visit site → Check Events Manager → Events recorded

---

## 🆘 TROUBLESHOOTING

### **"API key invalid"**
- Ensure no spaces before/after key
- Regenerate key and try again
- Check API provider dashboard for restrictions

### **"Failed to fetch"**
- Check internet connection
- Verify service is not down (check status page)
- Try different network/VPN

### **"Unauthorized"**
- Key might be expired
- Check API key permissions
- Regenerate and update key

### **"Rate limit exceeded"**
- Free tier exhausted
- Upgrade to paid plan
- Or wait for reset (usually monthly)

---

## 📞 SUPPORT LINKS

| Service | Support URL |
|---------|-------------|
| Remove.bg | https://www.remove.bg/support |
| Razorpay | https://razorpay.com/support/ |
| WhatsApp | https://developers.facebook.com/support/ |
| Twilio | https://support.twilio.com/ |
| SendGrid | https://support.sendgrid.com/ |
| OpenAI | https://help.openai.com/ |
| Google Analytics | https://support.google.com/analytics/ |

---

## 🚀 READY TO GO!

✅ **Essential Setup (30 min):**
- Razorpay + Remove.bg + Gmail + Analytics

✅ **Full Setup (2-3 hours):**
- Everything above + WhatsApp + SMS + AI

✅ **Test Everything:**
- Use `/QUICK_TEST_CHECKLIST.md`

**Your platform is now fully powered! 🎉**

---

*Last Updated: March 29, 2026*  
*Platform: Toodies v3.0*  
*All services tested and verified ✅*
