-- Working family sharing.
--
-- `give-access` has always been able to invite a partner, co-parent, guardian
-- or nanny and show them a code — but family-store never touched the database,
-- so `family_members` stayed empty and no invited person could ever join. The
-- screen looked finished with nothing behind it.
--
-- This adds: the columns the app's permission model needs, a way to redeem a
-- code, and — the part that actually matters — read/write access for accepted
-- members on the family's data.

-- ---------------------------------------------------------------------------
-- VOCABULARY
--
-- The table shipped with CHECK constraints from an earlier design —
-- role IN (parent, guardian, caregiver) and status IN (pending, active,
-- inactive) — while the app has always used AccessType (partner, co_parent,
-- guardian, child) and status (pending, accepted, declined). Redeeming an
-- invite therefore failed on the status check.
--
-- The table is empty, so the constraints are widened to the app's vocabulary
-- while keeping the legacy values valid.
-- ---------------------------------------------------------------------------

ALTER TABLE public.family_members DROP CONSTRAINT IF EXISTS family_members_role_check;
ALTER TABLE public.family_members ADD CONSTRAINT family_members_role_check
  CHECK (role IN ('partner', 'co_parent', 'guardian', 'caregiver', 'parent', 'child'));

ALTER TABLE public.family_members DROP CONSTRAINT IF EXISTS family_members_status_check;
ALTER TABLE public.family_members ADD CONSTRAINT family_members_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'active', 'inactive'));

-- ---------------------------------------------------------------------------
-- COLUMNS
-- ---------------------------------------------------------------------------

-- Mirrors MemberPermissions in src/lib/state/family-store.ts. JSONB because the
-- permission set is still moving; a column each would mean a migration per flag.
ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Which children this member may see. NULL or empty means "all of them", which
-- is what a partner or co-parent gets; a guardian or nanny is usually limited to
-- specific children.
ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS child_ids UUID[];

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Redemption looks a code up directly.
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_members_invite_code
  ON public.family_members (invite_code)
  WHERE invite_code IS NOT NULL AND status = 'pending';

CREATE INDEX IF NOT EXISTS idx_family_members_user
  ON public.family_members (user_id) WHERE user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- WHO CAN SEE WHAT
-- ---------------------------------------------------------------------------

-- Every parent whose data the caller may reach: themselves, plus any family
-- they have an accepted membership in.
--
-- SECURITY DEFINER so policies on children/tasks/rewards can consult
-- family_members without needing their own select policy there, and so the
-- lookup cannot recurse back through RLS.
CREATE OR REPLACE FUNCTION public.accessible_parent_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid()
  UNION
  SELECT fm.family_id
    FROM public.family_members fm
   WHERE fm.user_id = auth.uid()
     AND fm.status = 'accepted';
$$;

-- Every child the caller may reach, honouring a member's child_ids limit.
CREATE OR REPLACE FUNCTION public.accessible_child_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT c.id FROM public.children c WHERE c.parent_id = auth.uid()
  UNION
  SELECT c.id
    FROM public.children c
    JOIN public.family_members fm ON fm.family_id = c.parent_id
   WHERE fm.user_id = auth.uid()
     AND fm.status = 'accepted'
     AND (
       fm.child_ids IS NULL
       OR cardinality(fm.child_ids) = 0
       OR c.id = ANY (fm.child_ids)
     );
$$;

-- Does this member hold a given permission flag in the family that owns `p_parent`?
CREATE OR REPLACE FUNCTION public.member_can(p_parent UUID, p_flag TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (fm.permissions ->> p_flag)::boolean
       FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.family_id = p_parent
        AND fm.status = 'accepted'
      LIMIT 1),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.accessible_parent_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accessible_child_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.member_can(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- MEMBER ACCESS TO FAMILY DATA
--
-- Added as SEPARATE permissive policies rather than by rewriting the existing
-- owner ones. Permissive policies OR together, so the owner's access is
-- untouched and a mistake here cannot lock a parent out of their own family.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS children_member_read ON public.children;
CREATE POLICY children_member_read ON public.children
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.accessible_child_ids()));

DROP POLICY IF EXISTS children_member_write ON public.children;
CREATE POLICY children_member_write ON public.children
  FOR UPDATE TO authenticated
  USING (id IN (SELECT public.accessible_child_ids()) AND public.member_can(parent_id, 'canEditChildren'))
  WITH CHECK (id IN (SELECT public.accessible_child_ids()) AND public.member_can(parent_id, 'canEditChildren'));

DROP POLICY IF EXISTS tasks_member_read ON public.tasks;
CREATE POLICY tasks_member_read ON public.tasks
  FOR SELECT TO authenticated
  USING (child_id IN (SELECT public.accessible_child_ids()));

-- A guardian approving a task is the main reason to grant write here.
DROP POLICY IF EXISTS tasks_member_write ON public.tasks;
CREATE POLICY tasks_member_write ON public.tasks
  FOR ALL TO authenticated
  USING (
    child_id IN (SELECT public.accessible_child_ids())
    AND EXISTS (
      SELECT 1 FROM public.children c
       WHERE c.id = tasks.child_id AND public.member_can(c.parent_id, 'canEditTasks')
    )
  )
  WITH CHECK (
    child_id IN (SELECT public.accessible_child_ids())
    AND EXISTS (
      SELECT 1 FROM public.children c
       WHERE c.id = tasks.child_id AND public.member_can(c.parent_id, 'canEditTasks')
    )
  );

DROP POLICY IF EXISTS rewards_member_read ON public.rewards;
CREATE POLICY rewards_member_read ON public.rewards
  FOR SELECT TO authenticated
  USING (child_id IS NULL OR child_id IN (SELECT public.accessible_child_ids()));

DROP POLICY IF EXISTS calendar_member_read ON public.calendar_events;
CREATE POLICY calendar_member_read ON public.calendar_events
  FOR SELECT TO authenticated
  USING (parent_id IN (SELECT public.accessible_parent_ids()));

DROP POLICY IF EXISTS deadlines_member_read ON public.deadlines;
CREATE POLICY deadlines_member_read ON public.deadlines
  FOR SELECT TO authenticated
  USING (parent_id IN (SELECT public.accessible_parent_ids()));

-- ---------------------------------------------------------------------------
-- REDEEMING AN INVITE
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER because the person redeeming is, by definition, not yet a
-- member — RLS would refuse them the row they are trying to claim.
CREATE OR REPLACE FUNCTION public.redeem_family_invite(p_code TEXT, p_name TEXT)
RETURNS TABLE (family_id UUID, role TEXT, member_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.family_members%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'must be signed in';
  END IF;

  SELECT * INTO v_row
    FROM public.family_members
   WHERE invite_code = upper(trim(p_code))
     AND status = 'pending'
   LIMIT 1;

  -- One message for every failure, so the endpoint cannot be used to discover
  -- valid codes.
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'invalid or expired invite';
  END IF;

  IF v_row.invite_expires_at IS NOT NULL AND v_row.invite_expires_at < NOW() THEN
    RAISE EXCEPTION 'invalid or expired invite';
  END IF;

  -- A parent cannot join their own family as a member.
  IF v_row.family_id = auth.uid() THEN
    RAISE EXCEPTION 'invalid or expired invite';
  END IF;

  UPDATE public.family_members
     SET user_id = auth.uid(),
         status = 'accepted',
         accepted_at = NOW(),
         name = COALESCE(NULLIF(trim(p_name), ''), name),
         invite_code = NULL,          -- burn it: single use
         updated_at = NOW()
   WHERE id = v_row.id;

  RETURN QUERY SELECT v_row.family_id, v_row.role, COALESCE(NULLIF(trim(p_name), ''), v_row.name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_family_invite(TEXT, TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_family_invite(TEXT, TEXT) FROM anon;
