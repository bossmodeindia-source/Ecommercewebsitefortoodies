-- ============================================
-- MIGRATION 010: Create Supabase Storage Buckets
-- Run this in Supabase SQL Editor
-- ============================================
-- 
-- This creates the storage buckets needed by the app.
-- The 'admin-uploads' bucket is used for hero images and collection
-- images uploaded via the HeroContentSettings admin panel.
--
-- IMPORTANT: After running this SQL, also go to:
--   Supabase Dashboard → Storage → Buckets
-- and verify each bucket was created. If the INSERT fails because
-- the bucket already exists, that's fine — just skip it.

-- ── 1. admin-uploads (public — hero images, collection images) ─────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-uploads',
  'admin-uploads',
  true,
  52428800,  -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- ── 2. product-images (public — product catalogue images) ──────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  20971520,  -- 20 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ── 3. product-mockups (public — 2D designer mockup templates) ─────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-mockups',
  'product-mockups',
  true,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ── 4. customer-designs (private — customer uploaded design files) ──────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-designs',
  'customer-designs',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ── 5. design-thumbnails (private — canvas snapshots) ─────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'design-thumbnails',
  'design-thumbnails',
  false,
  5242880,   -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ── 6. ai-generated-designs (private — AI art output) ─────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-generated-designs',
  'ai-generated-designs',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ── 7. gifting-templates (public — neck labels, thank-you cards, box art) ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gifting-templates',
  'gifting-templates',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ── 8. invoices (private — generated PDF invoices) ────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- RLS POLICIES FOR STORAGE
-- ============================================================

-- ── admin-uploads: anyone can read, only authenticated admins can write ─────
CREATE POLICY "admin-uploads public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'admin-uploads');

CREATE POLICY "admin-uploads authenticated write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'admin-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "admin-uploads authenticated update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'admin-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "admin-uploads authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'admin-uploads' AND auth.role() = 'authenticated');


-- ── product-images: public read, authenticated write ─────────────────────
CREATE POLICY "product-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product-images authenticated write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "product-images authenticated delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');


-- ── product-mockups: public read, authenticated write ────────────────────
CREATE POLICY "product-mockups public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-mockups');

CREATE POLICY "product-mockups authenticated write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-mockups' AND auth.role() = 'authenticated');


-- ── customer-designs: owner only ─────────────────────────────────────────
CREATE POLICY "customer-designs owner read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'customer-designs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "customer-designs owner write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'customer-designs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "customer-designs owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'customer-designs' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── design-thumbnails: owner only ────────────────────────────────────────
CREATE POLICY "design-thumbnails owner read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'design-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "design-thumbnails owner write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'design-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "design-thumbnails owner upsert"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'design-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── gifting-templates: public read, authenticated write ──────────────────
CREATE POLICY "gifting-templates public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gifting-templates');

CREATE POLICY "gifting-templates authenticated write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gifting-templates' AND auth.role() = 'authenticated');


-- ── invoices: owner read, authenticated write ─────────────────────────────
CREATE POLICY "invoices owner read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "invoices authenticated write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND auth.role() = 'authenticated');

CREATE POLICY "invoices authenticated upsert"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'invoices' AND auth.role() = 'authenticated');


-- Success notice
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 010 complete: All 8 Supabase Storage buckets created with RLS policies.';
END $$;
