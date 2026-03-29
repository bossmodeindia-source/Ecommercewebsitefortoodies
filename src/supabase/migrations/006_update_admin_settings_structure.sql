-- ============================================
-- Update admin_settings table structure
-- Change from key-value store to single-row with individual columns
-- ============================================

-- Drop existing admin_settings table
DROP TABLE IF EXISTS admin_settings CASCADE;

-- Create new admin_settings table with individual columns
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Contact Information
  whatsapp_number TEXT,
  gmail TEXT,
  
  -- Payment Gateway Settings
  razorpay_key_id TEXT,
  razorpay_key_secret TEXT,
  razorpay_enabled BOOLEAN DEFAULT FALSE,
  payment_methods JSONB DEFAULT '{"razorpay": true, "upi": true, "cod": true, "netbanking": true, "wallet": true, "emi": true}'::jsonb,
  
  -- Designer Integration
  designer_url TEXT,
  
  -- WhatsApp API Settings
  whatsapp_api_token TEXT,
  whatsapp_phone_number_id TEXT,
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  
  -- Email Settings (Gmail)
  gmail_api_key TEXT,
  gmail_client_id TEXT,
  gmail_client_secret TEXT,
  
  -- Email Settings (SMTP)
  smtp_host TEXT,
  smtp_port TEXT,
  smtp_username TEXT,
  smtp_password TEXT,
  email_enabled BOOLEAN DEFAULT FALSE,
  email_provider TEXT CHECK (email_provider IN ('gmail', 'smtp', 'sendgrid')) DEFAULT 'gmail',
  
  -- SMS API Settings
  sms_enabled BOOLEAN DEFAULT FALSE,
  sms_provider TEXT CHECK (sms_provider IN ('twilio', 'msg91', 'aws-sns', 'other')) DEFAULT 'twilio',
  
  -- Twilio Settings
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number TEXT,
  
  -- MSG91 Settings
  msg91_auth_key TEXT,
  msg91_sender_id TEXT,
  msg91_template_id TEXT,
  
  -- AWS SNS Settings
  aws_sns_access_key_id TEXT,
  aws_sns_secret_access_key TEXT,
  aws_sns_region TEXT DEFAULT 'us-east-1',
  
  -- Other SMS API Settings
  other_sms_api_url TEXT,
  other_sms_api_key TEXT,
  other_sms_api_method TEXT CHECK (other_sms_api_method IN ('GET', 'POST')) DEFAULT 'POST',
  
  -- SEO & Analytics Settings
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  analytics_enabled BOOLEAN DEFAULT FALSE,
  
  -- Background Removal API Settings
  background_removal_api_key TEXT,
  background_removal_enabled BOOLEAN DEFAULT FALSE,
  
  -- Business Information (for backward compatibility)
  company_gstin TEXT,
  company_address TEXT,
  company_logo TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_settings_updated_at();

-- Insert default row (only one row should exist)
INSERT INTO admin_settings (
  whatsapp_number,
  gmail,
  razorpay_enabled,
  background_removal_enabled,
  analytics_enabled,
  email_enabled,
  sms_enabled,
  whatsapp_enabled
) VALUES (
  '',
  '',
  false,
  false,
  false,
  false,
  false,
  false
);

-- Add comment to table
COMMENT ON TABLE admin_settings IS 'Single-row table storing all admin configuration settings. Only one row should exist in this table.';
