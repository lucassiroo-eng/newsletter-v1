-- ============================================================
-- Initial schema for multi-user newsletter platform
-- Migration: 20260517000000_initial_schema
-- ============================================================

-- ===================
-- 1. TABLES
-- ===================

-- profiles (extends auth.users)
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url  text,
  locale      text DEFAULT 'en' CHECK (locale IN ('en', 'es', 'fr')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- newsletters (core entity — one per user-topic)
CREATE TABLE newsletters (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            text NOT NULL,
  topic            text NOT NULL,
  frequency        text NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  is_active        boolean DEFAULT true,
  is_public        boolean DEFAULT false,
  subscriber_count int DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- sources (RSS feeds / web pages per newsletter)
CREATE TABLE sources (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id  uuid NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  name           text NOT NULL,
  url            text,
  source_type    text DEFAULT 'blog' CHECK (source_type IN ('rss', 'blog', 'news', 'podcast', 'webpage', 'other')),
  is_active      boolean DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

-- subscriptions (users subscribing to public newsletters)
CREATE TABLE subscriptions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  newsletter_id  uuid NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  receive_email  boolean DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (user_id, newsletter_id)
);

-- issues (each generated newsletter edition)
CREATE TABLE issues (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id  uuid NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  date           date NOT NULL,
  stories        jsonb NOT NULL DEFAULT '[]'::jsonb,
  html_content   text,
  email_subject  text,
  status         text DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'sent', 'failed')),
  error_message  text,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (newsletter_id, date)
);

-- generation_queue (work queue for the cron)
CREATE TABLE generation_queue (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id  uuid NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  scheduled_for  date NOT NULL,
  status         text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at     timestamptz,
  completed_at   timestamptz,
  error_message  text,
  created_at     timestamptz DEFAULT now()
);

-- ===================
-- 2. INDEXES
-- ===================

CREATE INDEX idx_newsletters_owner_id ON newsletters (owner_id);
CREATE INDEX idx_newsletters_public_popular ON newsletters (is_public, subscriber_count DESC) WHERE is_public = true;

CREATE INDEX idx_sources_newsletter_id ON sources (newsletter_id);

CREATE INDEX idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_newsletter_id ON subscriptions (newsletter_id);

CREATE INDEX idx_issues_newsletter_date ON issues (newsletter_id, date DESC);

CREATE INDEX idx_generation_queue_pending ON generation_queue (status, scheduled_for) WHERE status = 'pending';

-- ===================
-- 3. ENABLE RLS
-- ===================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;

-- ===================
-- 4. RLS POLICIES
-- ===================

-- ----- profiles -----

-- Anyone authenticated can read profiles (display_name, avatar_url)
CREATE POLICY "profiles: anyone can select"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles: users can insert own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles: users can update own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ----- newsletters -----

-- Owners have full SELECT on their newsletters
CREATE POLICY "newsletters: owner can select"
  ON newsletters FOR SELECT
  USING (owner_id = auth.uid() OR is_public = true);

-- Owners can insert newsletters
CREATE POLICY "newsletters: owner can insert"
  ON newsletters FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Owners can update their newsletters
CREATE POLICY "newsletters: owner can update"
  ON newsletters FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Owners can delete their newsletters
CREATE POLICY "newsletters: owner can delete"
  ON newsletters FOR DELETE
  USING (owner_id = auth.uid());

-- ----- sources -----

-- Owner of parent newsletter can select sources
CREATE POLICY "sources: owner can select"
  ON sources FOR SELECT
  USING (newsletter_id IN (SELECT id FROM newsletters WHERE owner_id = auth.uid()));

-- Owner of parent newsletter can insert sources
CREATE POLICY "sources: owner can insert"
  ON sources FOR INSERT
  WITH CHECK (newsletter_id IN (SELECT id FROM newsletters WHERE owner_id = auth.uid()));

-- Owner of parent newsletter can update sources
CREATE POLICY "sources: owner can update"
  ON sources FOR UPDATE
  USING (newsletter_id IN (SELECT id FROM newsletters WHERE owner_id = auth.uid()))
  WITH CHECK (newsletter_id IN (SELECT id FROM newsletters WHERE owner_id = auth.uid()));

-- Owner of parent newsletter can delete sources
CREATE POLICY "sources: owner can delete"
  ON sources FOR DELETE
  USING (newsletter_id IN (SELECT id FROM newsletters WHERE owner_id = auth.uid()));

-- ----- subscriptions -----

-- Users can select their own subscriptions
CREATE POLICY "subscriptions: users can select own"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid()
    OR newsletter_id IN (SELECT id FROM newsletters WHERE owner_id = auth.uid())
  );

-- Users can insert their own subscriptions
CREATE POLICY "subscriptions: users can insert own"
  ON subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own subscriptions
CREATE POLICY "subscriptions: users can update own"
  ON subscriptions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own subscriptions
CREATE POLICY "subscriptions: users can delete own"
  ON subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- ----- issues -----

-- Newsletter owner can select issues
CREATE POLICY "issues: owner can select"
  ON issues FOR SELECT
  USING (
    newsletter_id IN (SELECT id FROM newsletters WHERE owner_id = auth.uid())
  );

-- Subscribers can select issues
CREATE POLICY "issues: subscribers can select"
  ON issues FOR SELECT
  USING (
    newsletter_id IN (SELECT newsletter_id FROM subscriptions WHERE user_id = auth.uid())
  );

-- Anyone can select issues from public newsletters
CREATE POLICY "issues: public newsletters anyone can select"
  ON issues FOR SELECT
  USING (
    newsletter_id IN (SELECT id FROM newsletters WHERE is_public = true)
  );

-- ----- generation_queue -----
-- No user-facing policies. Only service_role can access.
-- RLS is enabled but no policies are created, so all access is denied
-- for authenticated/anon roles. service_role bypasses RLS by default.

-- ===================
-- 5. FUNCTIONS & TRIGGERS
-- ===================

-- ----- 5a. Auto-create profile on auth.users insert -----

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ----- 5b. Update subscriber_count on subscriptions insert/delete -----

CREATE OR REPLACE FUNCTION update_subscriber_count()
RETURNS trigger AS $$
DECLARE
  target_newsletter_id uuid;
BEGIN
  -- Determine which newsletter_id was affected
  IF TG_OP = 'DELETE' THEN
    target_newsletter_id := OLD.newsletter_id;
  ELSE
    target_newsletter_id := NEW.newsletter_id;
  END IF;

  UPDATE newsletters
  SET subscriber_count = (
    SELECT COUNT(*)
    FROM subscriptions
    WHERE subscriptions.newsletter_id = target_newsletter_id
  )
  WHERE id = target_newsletter_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_subscription_change
  AFTER INSERT OR DELETE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriber_count();

-- ----- 5c. updated_at trigger for profiles and newsletters -----

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_newsletters_updated_at
  BEFORE UPDATE ON newsletters
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
