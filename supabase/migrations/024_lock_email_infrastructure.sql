-- Lock down the email infrastructure tables.
--
-- Ten tables carried `FOR ALL USING (true)` with no role restriction, which is
-- not a weak policy — it is no policy at all. Anyone holding the anon key could
-- read AND write them, and the anon key ships inside both app binaries and sits
-- in a public repository.
--
-- Verified before writing this: `PATCH /rest/v1/email_system_config` as anon
-- returned HTTP 204. That row holds `global_kill_switch`, so any stranger could
-- disable every email the product sends. The same policies exposed
-- email_delivery_records (who was emailed and when), email_unsubscribes and
-- email_blocks (raw addresses), and allowed tampering with all of them.
--
-- These are backend tables. Nothing in either app reads them directly — the
-- Edge Functions use the service role, which bypasses RLS entirely and is
-- therefore unaffected by everything below. Admins keep read access for the
-- dashboard.

DO $$
DECLARE
  t TEXT;
  email_tables TEXT[] := ARRAY[
    'email_analytics_daily',
    'email_audience_segments',
    'email_blocks',
    'email_compliance_records',
    'email_delivery_records',
    'email_dry_runs',
    'email_schedules',
    'email_system_config',
    'email_template_versions',
    'email_unsubscribes'
  ];
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY email_tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    -- Drop every existing policy on the table. They are all variations of
    -- USING (true) and none of them should survive.
    FOR pol IN
      SELECT policyname FROM pg_policies
       WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Belt and braces: even without a policy, no grant means no access.
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);

    -- Admins may read, for the admin dashboard.
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_admin_user())',
      t || '_admin_read', t
    );

    -- Admins may also manage configuration and schedules.
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user())',
      t || '_admin_write', t
    );
  END LOOP;
END $$;

-- A signed-in user may still see their OWN unsubscribe state, which the email
-- preferences screen needs. Everything else about the table stays admin-only.
DROP POLICY IF EXISTS email_unsubscribes_own_read ON public.email_unsubscribes;
CREATE POLICY email_unsubscribes_own_read ON public.email_unsubscribes
  FOR SELECT TO authenticated
  USING (
    email = (SELECT p.email FROM public.parents p WHERE p.id = auth.uid())
  );
