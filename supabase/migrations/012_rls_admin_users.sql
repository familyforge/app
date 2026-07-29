-- Lock down admin_users.
--
-- Before this migration:
--   * RLS was DISABLED on admin_users
--   * role `anon` held SELECT, INSERT, UPDATE, DELETE and TRUNCATE
--
-- The anon key is compiled into both the parent and child app binaries and is
-- extractable from any TestFlight or App Store install. So anyone who downloaded
-- the app could read every admin's email and password_hash, insert themselves a
-- row with role 'superadmin', or delete the table outright. This was privilege
-- escalation into the admin dashboard, not merely a data leak.
--
-- Access model after this migration:
--   anon           -> no access at all (revoked at the GRANT level)
--   authenticated  -> may read their OWN row (this is how the dashboard answers
--                     "am I an admin?"), and admins may read/write every row
--                     (the dashboard lists, upserts and deletes admins).

-- A policy on admin_users cannot query admin_users directly without recursing.
-- SECURITY DEFINER breaks the cycle; the pinned search_path stops the function
-- being hijacked by a caller-controlled schema.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users a
    WHERE a.id = auth.uid()
       OR lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

REVOKE ALL ON public.admin_users FROM anon;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Read: your own row, or everything if you are an admin.
DROP POLICY IF EXISTS admin_users_select ON public.admin_users;
CREATE POLICY admin_users_select ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR public.is_admin_user()
  );

-- Write: admins only. Covers the dashboard's upsert and delete paths.
DROP POLICY IF EXISTS admin_users_write ON public.admin_users;
CREATE POLICY admin_users_write ON public.admin_users
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- NOTE: bootstrapping. Because writes require an existing admin, the table must
-- never be emptied — there would be no way to insert the first admin back
-- through the API. Use the service role key or the SQL editor to recover.
