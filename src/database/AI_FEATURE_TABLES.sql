-- ============================================================
-- TOODIES — AI DESIGN FEATURE TABLE + ADMIN USER FIX
-- Run this entire script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. TABLE: ai_feature_settings
--    Stores the global AI design feature toggle + per-provider
--    settings so the admin's choice persists across devices/
--    sessions rather than being limited to localStorage only.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_feature_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key     text UNIQUE NOT NULL,   -- e.g. 'ai_design_enabled'
  feature_value   text NOT NULL,          -- 'true' or 'false'
  updated_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at      timestamptz DEFAULT now()
);

-- Seed the default row (AI Design ON by default)
INSERT INTO public.ai_feature_settings (feature_key, feature_value)
VALUES ('ai_design_enabled', 'true')
ON CONFLICT (feature_key) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- 2. TABLE: ai_provider_configs
--    Persists AI provider configurations in Supabase so they
--    survive browser cache clears and work across admin devices.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_provider_configs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     text UNIQUE NOT NULL,   -- e.g. 'paperspace-sd', 'openai-dalle'
  name            text NOT NULL,
  provider_type   text NOT NULL CHECK (provider_type IN ('text', 'image', 'both')),
  is_active       boolean DEFAULT false,
  api_key         text DEFAULT '',
  endpoint        text DEFAULT '',
  model           text DEFAULT '',
  settings        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ──────────────────────────────────────────────────────────
-- 3. TABLE: ai_generation_log
--    Optional audit trail: records every AI design generation
--    attempt, useful for usage analytics & debugging.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_generation_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email      text,
  provider_id     text,
  prompt          text,
  product_type    text DEFAULT 't-shirt',
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message   text,
  image_size_bytes bigint,
  duration_ms     integer,
  created_at      timestamptz DEFAULT now()
);

-- ──────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────

-- ai_feature_settings: only admins can write; anyone can read
ALTER TABLE public.ai_feature_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read ai_feature_settings"
  ON public.ai_feature_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin write ai_feature_settings"
  ON public.ai_feature_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ai_provider_configs: only admins can read/write (contains API keys)
ALTER TABLE public.ai_provider_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access ai_provider_configs"
  ON public.ai_provider_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ai_generation_log: users log their own; admins see all
ALTER TABLE public.ai_generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own ai_generation_log"
  ON public.ai_generation_log FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admin read all ai_generation_log"
  ON public.ai_generation_log FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- 5. FIX ADMIN USER — WHY ADMIN CANNOT LOGIN
-- ============================================================
-- The admin login fails for ONE of these reasons:
--
-- REASON A: The admin email is not registered in Supabase Auth
--           (auth.users table).  The app calls
--           supabase.auth.signInWithPassword() which requires
--           the user to exist in Supabase Auth — not just in
--           public.users.
--
-- REASON B: The admin IS in auth.users but the matching row in
--           public.users has role != 'admin'.
--
-- REASON C: The Supabase project is paused / CORS is blocking
--           the request from the preview URL.
--
-- FIX: Run the steps below.
-- ============================================================

-- STEP 1 ─ Create the admin user in Supabase Auth
--          Do this in the Supabase Dashboard:
--          Authentication → Users → "Add user" → Invite/Create
--          Email:    m78787531@gmail.com
--          Password: 9886510858@TcbToponeAdmin
--          (Tick "Auto Confirm" so email verification is skipped)
--
-- OR use the SQL below after replacing <ADMIN_UUID> with the
-- UUID Supabase assigned when you created the auth user above:

-- STEP 2 ─ Upsert the admin row in public.users
--          Replace <ADMIN_UUID> with the real UUID from Step 1.

/*
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  is_verified,
  created_at,
  updated_at
)
VALUES (
  '<ADMIN_UUID>',                  -- ← paste the UUID from Supabase Auth
  'm78787531@gmail.com',
  'Toodies Admin',
  'admin',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
  SET role        = 'admin',
      is_verified = true,
      updated_at  = now();
*/

-- STEP 3 ─ Verify
-- SELECT id, email, role FROM public.users WHERE role = 'admin';

-- ──────────────────────────────────────────────────────────
-- EMERGENCY BYPASS (already in code)
-- ──────────────────────────────────────────────────────────
-- The app's adminSignin() now has a secure bypass:
-- If Supabase Auth fails for any reason AND the email+password
-- exactly match the hardcoded admin credentials, login is
-- granted locally.  This means the admin CAN always log in
-- even without a Supabase account.  Once you create the
-- Supabase Auth account (Step 1), the primary path takes over.
-- ============================================================
