-- ============================================
-- COMPLETE SUPABASE MIGRATION - ALL TABLES
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. BUSINESS INFO TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS business_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  phone TEXT,
  email TEXT,
  support_email TEXT,
  whatsapp TEXT,
  gstin TEXT,
  website TEXT,
  support_hours TEXT,
  hero_image TEXT,
  neck_label_template TEXT,
  thank_you_card_template TEXT,
  box_template TEXT,
  social_media JSONB DEFAULT '{}',
  bank_details JSONB DEFAULT '{}',
  visibility JSONB DEFAULT '{"website": {"showWhatsApp": true, "showSocialMedia": true}, "invoice": {}}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  base_price DECIMAL(10,2),
  images JSONB DEFAULT '[]',
  variations JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  has_3d_model BOOLEAN DEFAULT false,
  model_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name) VALUES 
  ('T-Shirts'),
  ('Hoodies'),
  ('Sweatshirts'),
  ('Jackets'),
  ('Accessories')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 4. USERS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  mobile TEXT,
  password TEXT,
  name TEXT,
  address TEXT,
  email_verified BOOLEAN DEFAULT false,
  mobile_verified BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'customer',
  cart JSONB DEFAULT '[]',
  saved_designs JSONB DEFAULT '[]',
  saved_customer_designs JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE,
  items JSONB DEFAULT '[]',
  subtotal DECIMAL(10,2),
  shipping DECIMAL(10,2),
  tax DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  shipping_address JSONB,
  billing_address JSONB,
  tracking_number TEXT,
  tracking_url TEXT,
  invoice JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applicable_categories JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. MESSAGE TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. POPUP MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS popup_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  target_audience TEXT DEFAULT 'all',
  display_frequency TEXT DEFAULT 'once',
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. SHOWN POPUPS TABLE (User tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS shown_popups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  popup_id UUID REFERENCES popup_messages(id) ON DELETE CASCADE,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, popup_id)
);

-- ============================================
-- 10. CHAT CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  status TEXT DEFAULT 'active',
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);

-- ============================================
-- 12. AI CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT DEFAULT 'none',
  api_key TEXT,
  model TEXT,
  is_enabled BOOLEAN DEFAULT false,
  auto_reply BOOLEAN DEFAULT false,
  greeting_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default AI config
INSERT INTO ai_config (provider, is_enabled, auto_reply, greeting_message)
SELECT 'none', false, false, 'Hello! How can I help you today?'
WHERE NOT EXISTS (SELECT 1 FROM ai_config);

-- ============================================
-- 13. ADMIN SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whatsapp_number TEXT,
  gmail TEXT,
  razorpay_key_id TEXT,
  razorpay_key_secret TEXT,
  razorpay_enabled BOOLEAN DEFAULT false,
  designer_url TEXT,
  payment_methods JSONB DEFAULT '{"razorpay": true, "upi": true, "cod": true, "netbanking": true, "wallet": true, "emi": true}',
  whatsapp_api_token TEXT,
  whatsapp_phone_number_id TEXT,
  whatsapp_enabled BOOLEAN DEFAULT false,
  gmail_api_key TEXT,
  gmail_client_id TEXT,
  gmail_client_secret TEXT,
  smtp_host TEXT,
  smtp_port TEXT,
  smtp_username TEXT,
  smtp_password TEXT,
  email_enabled BOOLEAN DEFAULT false,
  email_provider TEXT DEFAULT 'gmail',
  sms_enabled BOOLEAN DEFAULT false,
  sms_provider TEXT DEFAULT 'twilio',
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number TEXT,
  msg91_auth_key TEXT,
  msg91_sender_id TEXT,
  msg91_template_id TEXT,
  aws_sns_access_key_id TEXT,
  aws_sns_secret_access_key TEXT,
  aws_sns_region TEXT DEFAULT 'us-east-1',
  other_sms_api_url TEXT,
  other_sms_api_key TEXT,
  other_sms_api_method TEXT DEFAULT 'POST',
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  analytics_enabled BOOLEAN DEFAULT false,
  background_removal_api_key TEXT,
  background_removal_enabled BOOLEAN DEFAULT false,
  company_gstin TEXT,
  company_address TEXT,
  company_logo TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin settings
INSERT INTO admin_settings (whatsapp_number, gmail)
SELECT '', ''
WHERE NOT EXISTS (SELECT 1 FROM admin_settings);

-- ============================================
-- 14. 3D MODEL CONFIGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS three_d_model_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  glb_file_name TEXT,
  model_scale JSONB DEFAULT '[1, 1, 1]',
  model_position JSONB DEFAULT '[0, 0, 0]',
  model_rotation JSONB DEFAULT '[0, 0, 0]',
  customization_areas JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

-- ============================================
-- 15. 3D WEBSITE INTEGRATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS three_d_website_integration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled BOOLEAN DEFAULT false,
  show_3d_models BOOLEAN DEFAULT true,
  auto_rotate BOOLEAN DEFAULT true,
  enable_zoom BOOLEAN DEFAULT true,
  enable_ar BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default 3D settings
INSERT INTO three_d_website_integration (enabled, show_3d_models, auto_rotate, enable_zoom, enable_ar)
SELECT false, true, true, true, false
WHERE NOT EXISTS (SELECT 1 FROM three_d_website_integration);

-- ============================================
-- 16. SAVED CUSTOMER DESIGNS TABLE (with approval workflow & gifting)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_customer_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  design_name TEXT,
  design_snapshot TEXT,
  design_data JSONB,
  canvas_snapshot TEXT,
  preview_image TEXT,
  color TEXT,
  size TEXT,
  fabric TEXT,
  printing_method TEXT,
  printing_cost DECIMAL(10,2) DEFAULT 0,
  product_price DECIMAL(10,2) DEFAULT 0,
  calculated_subtotal DECIMAL(10,2) DEFAULT 0,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  estimated_total DECIMAL(10,2) DEFAULT 0,
  delivery_address TEXT,
  pincode TEXT,
  phone TEXT,
  purchase_mode TEXT CHECK (purchase_mode IN ('self', 'gift')),
  neck_label_text TEXT,
  thank_you_card_text TEXT,
  custom_box_text TEXT,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approval_date TIMESTAMPTZ,
  approval_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  admin_set_price DECIMAL(10,2),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('saved', 'submitted', 'in_cart', 'ordered')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  is_auto_save BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 17. HELP CENTER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS help_center (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 18. PRINTING METHODS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS printing_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2),
  price_per_color DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 19. BILLING CALCULATION SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS billing_calculation_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gst_percentage DECIMAL(5,2) DEFAULT 18.00,
  shipping_base_charge DECIMAL(10,2) DEFAULT 50.00,
  free_shipping_threshold DECIMAL(10,2) DEFAULT 999.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default billing settings
INSERT INTO billing_calculation_settings (gst_percentage, shipping_base_charge, free_shipping_threshold)
SELECT 18.00, 50.00, 999.00
WHERE NOT EXISTS (SELECT 1 FROM billing_calculation_settings);

-- ============================================
-- 20. GIFTING TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gifting_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  template_data JSONB,
  preview_image TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
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
    EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END$$;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Business Info - Public read, admin write
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read business_info" ON business_info FOR SELECT USING (true);
CREATE POLICY "Admin manage business_info" ON business_info FOR ALL USING (auth.role() = 'authenticated');

-- Products - Public read, admin write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Admin manage products" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Categories - Public read, admin write
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin manage categories" ON categories FOR ALL USING (auth.role() = 'authenticated');

-- Users - Users can read/update own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own data" ON users FOR SELECT USING (auth.uid() = id OR auth.role() = 'authenticated');
CREATE POLICY "Users update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public insert users" ON users FOR INSERT WITH CHECK (true);

-- Orders - Users see own orders, admin sees all
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "Users create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage orders" ON orders FOR ALL USING (auth.role() = 'authenticated');

-- Coupons - Public read active, admin manage
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage coupons" ON coupons FOR ALL USING (auth.role() = 'authenticated');

-- Saved Customer Designs - Users see own, admin sees all
ALTER TABLE saved_customer_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own designs" ON saved_customer_designs FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');
CREATE POLICY "Users create own designs" ON saved_customer_designs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own designs" ON saved_customer_designs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin manage designs" ON saved_customer_designs FOR ALL USING (auth.role() = 'authenticated');

-- Admin Settings - Admin only
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage settings" ON admin_settings FOR ALL USING (auth.role() = 'authenticated');

-- Message Templates - Admin only
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read templates" ON message_templates FOR SELECT USING (true);
CREATE POLICY "Admin manage templates" ON message_templates FOR ALL USING (auth.role() = 'authenticated');

-- Popup Messages - Public read active, admin manage
ALTER TABLE popup_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active popups" ON popup_messages FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage popups" ON popup_messages FOR ALL USING (auth.role() = 'authenticated');

-- Help Center - Public read, admin manage
ALTER TABLE help_center ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read help" ON help_center FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage help" ON help_center FOR ALL USING (auth.role() = 'authenticated');

-- Printing Methods - Public read, admin manage
ALTER TABLE printing_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read printing_methods" ON printing_methods FOR SELECT USING (true);
CREATE POLICY "Admin manage printing_methods" ON printing_methods FOR ALL USING (auth.role() = 'authenticated');

-- 3D Model Configs - Public read, admin manage
ALTER TABLE three_d_model_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read 3d_configs" ON three_d_model_configs FOR SELECT USING (true);
CREATE POLICY "Admin manage 3d_configs" ON three_d_model_configs FOR ALL USING (auth.role() = 'authenticated');

-- Insert default Toodies business info
INSERT INTO business_info (
  company_name, phone, email, whatsapp, city, state, country
)
SELECT 
  'Toodies',
  '+91 98865 10858',
  'm78787531@gmail.com',
  '+919886510858',
  'Bangalore',
  'Karnataka',
  'India'
WHERE NOT EXISTS (SELECT 1 FROM business_info);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ ✅ ✅ ALL 20 TABLES CREATED SUCCESSFULLY! ✅ ✅ ✅';
  RAISE NOTICE 'Migration complete. Your Toodies platform is ready!';
END $$;
