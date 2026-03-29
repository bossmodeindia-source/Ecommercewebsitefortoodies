-- ============================================
-- TOODIES FRESH DATABASE SETUP V2
-- This will DROP existing tables and recreate them
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. DROP ALL EXISTING TABLES (CASCADE)
-- ============================================

DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS popup_messages CASCADE;
DROP TABLE IF EXISTS help_articles CASCADE;
DROP TABLE IF EXISTS message_templates CASCADE;
DROP TABLE IF EXISTS three_d_model_configs CASCADE;
DROP TABLE IF EXISTS ai_config CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS business_info CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS saved_customer_designs CASCADE;
DROP TABLE IF EXISTS printing_methods CASCADE;
DROP TABLE IF EXISTS product_variations CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop helper function
DROP FUNCTION IF EXISTS is_admin();

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  base_price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  model_3d_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variations (sizes, colors, etc.)
CREATE TABLE product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  additional_price DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Printing Methods
CREATE TABLE printing_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_per_unit DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Customer Designs (with approval workflow & gifting protocol)
CREATE TABLE saved_customer_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  design_name TEXT,
  design_snapshot TEXT,
  design_data JSONB,
  canvas_data TEXT,
  preview_image_url TEXT,
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
  status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'submitted', 'in_cart', 'ordered')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart Items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
  design_id UUID REFERENCES saved_customer_designs(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
  design_id UUID REFERENCES saved_customer_designs(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Info
CREATE TABLE business_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'USD',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Settings
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  background_remover_api_key TEXT,
  email_notifications_enabled BOOLEAN DEFAULT true,
  auto_approval_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Config
CREATE TABLE ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT CHECK (provider IN ('openai', 'anthropic', 'none')),
  api_key TEXT,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3D Model Configurations
CREATE TABLE three_d_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  model_url TEXT NOT NULL,
  texture_url TEXT,
  config_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Templates
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  template_type TEXT CHECK (template_type IN ('email', 'sms', 'notification')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Help Articles
CREATE TABLE help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Popup Messages
CREATE TABLE popup_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Conversations
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_designs_user ON saved_customer_designs(user_id);
CREATE INDEX idx_designs_status ON saved_customer_designs(approval_status);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_user ON cart_items(user_id);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE printing_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_customer_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE three_d_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE popup_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE HELPER FUNCTION (NO RECURSION)
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. CREATE RLS POLICIES
-- ============================================

-- Users table policies
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Allow user creation during signup"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Products policies
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (is_active = true OR is_admin());

CREATE POLICY "Admin can insert products"
ON products FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admin can update products"
ON products FOR UPDATE
USING (is_admin());

CREATE POLICY "Admin can delete products"
ON products FOR DELETE
USING (is_admin());

-- Product variations policies
CREATE POLICY "Anyone can view product variations"
ON product_variations FOR SELECT
USING (true);

CREATE POLICY "Admin can manage variations"
ON product_variations FOR ALL
USING (is_admin());

-- Saved customer designs policies
CREATE POLICY "Users can view own designs"
ON saved_customer_designs FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create own designs"
ON saved_customer_designs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own designs"
ON saved_customer_designs FOR UPDATE
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can delete own designs"
ON saved_customer_designs FOR DELETE
USING (auth.uid() = user_id OR is_admin());

-- Orders policies
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update orders"
ON orders FOR UPDATE
USING (is_admin());

-- Order items policies
CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR is_admin())
  )
);

CREATE POLICY "Users can create order items"
ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Cart items policies
CREATE POLICY "Users can view own cart"
ON cart_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
ON cart_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
ON cart_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
ON cart_items FOR DELETE
USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Anyone can view active categories"
ON categories FOR SELECT
USING (is_active = true OR is_admin());

CREATE POLICY "Admin can manage categories"
ON categories FOR ALL
USING (is_admin());

-- Printing methods policies
CREATE POLICY "Anyone can view active printing methods"
ON printing_methods FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage printing methods"
ON printing_methods FOR ALL
USING (is_admin());

-- Coupons policies
CREATE POLICY "Anyone can view active coupons"
ON coupons FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage coupons"
ON coupons FOR ALL
USING (is_admin());

-- Help articles policies
CREATE POLICY "Anyone can view published articles"
ON help_articles FOR SELECT
USING (is_published = true);

CREATE POLICY "Admin can manage articles"
ON help_articles FOR ALL
USING (is_admin());

-- Popup messages policies
CREATE POLICY "Anyone can view active popups"
ON popup_messages FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin can manage popups"
ON popup_messages FOR ALL
USING (is_admin());

-- Business info policies
CREATE POLICY "Anyone can view business info"
ON business_info FOR SELECT
USING (true);

CREATE POLICY "Admin can manage business info"
ON business_info FOR ALL
USING (is_admin());

-- Admin settings policies
CREATE POLICY "Admin can manage admin settings"
ON admin_settings FOR ALL
USING (is_admin());

-- AI config policies
CREATE POLICY "Admin can manage AI config"
ON ai_config FOR ALL
USING (is_admin());

-- 3D model configs policies
CREATE POLICY "Anyone can view model configs"
ON three_d_model_configs FOR SELECT
USING (true);

CREATE POLICY "Admin can manage model configs"
ON three_d_model_configs FOR ALL
USING (is_admin());

-- Message templates policies
CREATE POLICY "Admin can manage message templates"
ON message_templates FOR ALL
USING (is_admin());

-- Invoices policies
CREATE POLICY "Users can view own invoices"
ON invoices FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = invoices.order_id
    AND (orders.user_id = auth.uid() OR is_admin())
  )
);

CREATE POLICY "Admin can manage invoices"
ON invoices FOR ALL
USING (is_admin());

-- Invoice items policies
CREATE POLICY "Users can view own invoice items"
ON invoice_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM invoices
    JOIN orders ON orders.id = invoices.order_id
    WHERE invoices.id = invoice_items.invoice_id
    AND (orders.user_id = auth.uid() OR is_admin())
  )
);

CREATE POLICY "Admin can manage invoice items"
ON invoice_items FOR ALL
USING (is_admin());

-- Chat conversations policies
CREATE POLICY "Users can view own conversations"
ON chat_conversations FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create conversations"
ON chat_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON chat_conversations FOR UPDATE
USING (auth.uid() = user_id OR is_admin());

-- Chat messages policies
CREATE POLICY "Users can view messages in own conversations"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_conversations
    WHERE chat_conversations.id = chat_messages.conversation_id
    AND (chat_conversations.user_id = auth.uid() OR is_admin())
  )
);

CREATE POLICY "Users can send messages in own conversations"
ON chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_conversations
    WHERE chat_conversations.id = chat_messages.conversation_id
    AND (chat_conversations.user_id = auth.uid() OR is_admin())
  )
);

-- ============================================
-- 7. AUTO-POPULATE users TABLE FROM auth.users
-- ============================================

-- Create trigger function to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, is_verified)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    CASE 
      WHEN new.email = 'm78787531@gmail.com' THEN 'admin'
      ELSE 'customer'
    END,
    new.email_confirmed_at IS NOT NULL
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- COMPLETE
-- ============================================

SELECT 'Toodies database FRESH setup complete! All 20 tables created with RLS policies and auto-trigger for admin user.' as status;
