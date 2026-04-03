-- ============================================
-- Create business_info table
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop table if exists (optional - only if recreating)
-- DROP TABLE IF EXISTS business_info CASCADE;

-- Create business_info table
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
  visibility JSONB DEFAULT '{"website": {"showWhatsApp": true, "showSocialMedia": true}}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_business_info_updated_at ON business_info;
CREATE TRIGGER update_business_info_updated_at 
  BEFORE UPDATE ON business_info
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default business info if table is empty
INSERT INTO business_info (
  company_name,
  phone,
  email,
  whatsapp,
  city,
  state,
  country
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

-- Grant permissions
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON business_info
  FOR SELECT
  USING (true);

-- Allow authenticated users to update (admin check should be in app)
CREATE POLICY "Allow authenticated updates" ON business_info
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ business_info table created successfully!';
END $$;