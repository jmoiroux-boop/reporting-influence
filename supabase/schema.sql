-- ============================================================
-- Groupe SEB Influence Dashboard - Database Schema
-- Execute this SQL in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE upload_status AS ENUM ('processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE metric_type AS ENUM ('influencers_activated', 'video_views', 'engagement');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE entity_type AS ENUM ('gseb', 'competitor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('organic', 'paid', 'total');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- HELPER: updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'viewer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLE: uploads
-- ============================================================

CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  status upload_status NOT NULL DEFAULT 'processing',
  row_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS uploads_updated_at ON public.uploads;
CREATE TRIGGER uploads_updated_at
  BEFORE UPDATE ON public.uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_by ON public.uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON public.uploads(created_at DESC);

-- ============================================================
-- TABLE: influence_data
-- ============================================================

CREATE TABLE IF NOT EXISTS public.influence_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2030),
  brand TEXT NOT NULL,
  metric metric_type NOT NULL,
  entity entity_type NOT NULL,
  source source_type NOT NULL DEFAULT 'total',
  value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  raw_row_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_influence_data_upload ON public.influence_data(upload_id);
CREATE INDEX IF NOT EXISTS idx_influence_data_year ON public.influence_data(year);
CREATE INDEX IF NOT EXISTS idx_influence_data_composite ON public.influence_data(year, metric, entity);
CREATE INDEX IF NOT EXISTS idx_influence_data_brand ON public.influence_data(brand);

-- ============================================================
-- TABLE: kpi_comments
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kpi_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS kpi_comments_updated_at ON public.kpi_comments;
CREATE TRIGGER kpi_comments_updated_at
  BEFORE UPDATE ON public.kpi_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Seed default sections
INSERT INTO public.kpi_comments (section, content) VALUES
  ('influencers_activated', ''),
  ('video_views', ''),
  ('engagement', ''),
  ('brand_breakdown', ''),
  ('organic_paid', '')
ON CONFLICT (section) DO NOTHING;

-- ============================================================
-- HELPER FUNCTION: is_admin
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- uploads
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uploads_select_authenticated" ON public.uploads;
CREATE POLICY "uploads_select_authenticated"
  ON public.uploads FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "uploads_insert_admin" ON public.uploads;
CREATE POLICY "uploads_insert_admin"
  ON public.uploads FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "uploads_update_admin" ON public.uploads;
CREATE POLICY "uploads_update_admin"
  ON public.uploads FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "uploads_delete_admin" ON public.uploads;
CREATE POLICY "uploads_delete_admin"
  ON public.uploads FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- influence_data
ALTER TABLE public.influence_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "influence_data_select_authenticated" ON public.influence_data;
CREATE POLICY "influence_data_select_authenticated"
  ON public.influence_data FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "influence_data_insert_admin" ON public.influence_data;
CREATE POLICY "influence_data_insert_admin"
  ON public.influence_data FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "influence_data_delete_admin" ON public.influence_data;
CREATE POLICY "influence_data_delete_admin"
  ON public.influence_data FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- kpi_comments
ALTER TABLE public.kpi_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kpi_comments_select_authenticated" ON public.kpi_comments;
CREATE POLICY "kpi_comments_select_authenticated"
  ON public.kpi_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "kpi_comments_update_admin" ON public.kpi_comments;
CREATE POLICY "kpi_comments_update_admin"
  ON public.kpi_comments FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- STORAGE: excel-uploads bucket
-- Create this bucket in the Supabase Dashboard as PRIVATE
-- Then run these storage policies:
-- ============================================================

-- INSERT INTO storage.buckets (id, name, public) VALUES ('excel-uploads', 'excel-uploads', false)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "storage_upload_admin"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'excel-uploads' AND public.is_admin());

-- CREATE POLICY "storage_read_authenticated"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'excel-uploads');
