-- Enable RLS on the remaining 16 unprotected tables.
--
-- Every one of these had RLS disabled with `anon` holding full SELECT/INSERT/
-- UPDATE/DELETE. The anon key ships inside both app binaries, so all of this was
-- world-readable and world-writable by anyone who unzipped an IPA.
--
-- Three access models are used, chosen per table by who actually reads it:
--
--   1. app_settings      -> public read (it is subscription pricing, shown in
--                           the app before sign-in), admin write.
--   2. parent-owned      -> a parent sees and edits only their own rows; admins
--                           may read all. Used by the four tables the mobile app
--                           genuinely reads and writes.
--   3. admin-only        -> everything else. These 11 tables are referenced by
--                           NO client code today and are all empty, so deny-by-
--                           default costs nothing. When a real writer appears,
--                           relax the specific table deliberately rather than
--                           leaving the whole set open.
--
-- Depends on public.is_admin_user() from migration 012.

-- ---------------------------------------------------------------------------
-- 1. app_settings — public pricing config
-- ---------------------------------------------------------------------------
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- anon keeps SELECT only; it must not be able to rewrite your prices.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.app_settings FROM anon;

DROP POLICY IF EXISTS app_settings_public_read ON public.app_settings;
CREATE POLICY app_settings_public_read ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS app_settings_admin_write ON public.app_settings;
CREATE POLICY app_settings_admin_write ON public.app_settings
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ---------------------------------------------------------------------------
-- 2. Parent-owned tables the mobile app reads and writes
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['parent_goals', 'parent_profiles', 'parent_routines', 'user_streaks']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_own', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (parent_id = auth.uid())
        WITH CHECK (parent_id = auth.uid())
    $f$, t || '_own', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_read', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR SELECT TO authenticated
        USING (public.is_admin_user())
    $f$, t || '_admin_read', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Admin-only tables (no client reads these today; all currently empty)
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admin_audit_log', 'app_errors', 'engagement_snapshots', 'feature_usage',
    'onboarding_events', 'revenue_snapshots', 'subscription_events',
    'user_activity_log', 'user_flags', 'user_sessions', 'user_support_notes'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_only', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (public.is_admin_user())
        WITH CHECK (public.is_admin_user())
    $f$, t || '_admin_only', t);
  END LOOP;
END $$;
