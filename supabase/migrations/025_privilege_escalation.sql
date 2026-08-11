-- Close privilege escalation and harden SECURITY DEFINER functions.
--
-- 1. ADMIN SELF-PROMOTION (critical)
--
--    `parents` has UPDATE USING (id = auth.uid()), which lets a parent edit any
--    column of their own row — including `role`. is_admin() reads exactly that
--    column, so:
--
--      PATCH /rest/v1/parents?id=eq.<self>  {"role":"admin"}
--
--    turned any user into an admin with their own token. Verified: is_admin()
--    flipped false -> true, and the account then read all 9 children, all 13
--    parents and every task across every family.
--
--    The column is now writable only by the service role or by an existing
--    entry in admin_users — which is itself not self-writable (INSERT is
--    already blocked, verified).
--
-- 2. SEARCH PATH HIJACKING
--
--    Ten SECURITY DEFINER functions ran without a pinned search_path. A definer
--    function runs with its owner's privileges, so an unqualified reference
--    inside one can be captured by an attacker-created object earlier on the
--    path. Pinned to `public` here, matching the functions that already had it.
--
-- 3. FUNCTION EXECUTE GRANTS
--
--    Postgres grants EXECUTE to PUBLIC by default, so earlier
--    `REVOKE ... FROM anon` statements had no effect — PUBLIC still carried the
--    privilege. Revoked from PUBLIC, then granted back only where needed.

-- ---------------------------------------------------------------------------
-- 1. Lock privileged columns on `parents`
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_parent_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_service BOOLEAN := coalesce(auth.role(), '') = 'service_role';
  is_real_admin BOOLEAN := EXISTS (
    SELECT 1 FROM public.admin_users a
     WHERE a.id = auth.uid()
        OR lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
BEGIN
  IF is_service OR is_real_admin THEN
    RETURN NEW;
  END IF;

  -- Silently preserve rather than raise: the app PATCHes whole profile objects,
  -- so erroring would break ordinary profile saves that merely echo the value
  -- back unchanged.
  NEW.role := OLD.role;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_parent_privileged_columns ON public.parents;
CREATE TRIGGER trg_guard_parent_privileged_columns
  BEFORE UPDATE ON public.parents
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_parent_privileged_columns();

-- ---------------------------------------------------------------------------
-- 2. Pin search_path on every SECURITY DEFINER function that lacks it
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.prosecdef
       AND (
         p.proconfig IS NULL
         OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) k WHERE k LIKE 'search_path%')
       )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn.sig);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Stop granting EXECUTE to the world
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prokind = 'f'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn.sig);
  END LOOP;
END $$;

-- Grant back only what a signed-in user genuinely calls, either directly from
-- the app or indirectly because an RLS policy evaluates it as the caller.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_child_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accessible_parent_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accessible_child_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.member_can(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_child_login_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_family_invite(TEXT, TEXT) TO authenticated;
