-- Child accounts.
--
-- `children` rows were owned by a parent and had no link to an auth identity, so
-- no child could sign in to anything. This adds that link and the policies a
-- child session needs.

ALTER TABLE public.children ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- One auth identity per child. Partial index so the many NULLs (children whose
-- device has never been set up) do not collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_children_auth_user_id
  ON public.children (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Resolve the signed-in child's row id. SECURITY DEFINER so policies on `tasks`
-- and `rewards` can consult `children` without needing their own select policy
-- there; pinned search_path prevents schema hijacking.
CREATE OR REPLACE FUNCTION public.current_child_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.children WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- A child may read their own record (name, points, avatar) and nothing else.
DROP POLICY IF EXISTS children_self_read ON public.children;
CREATE POLICY children_self_read ON public.children
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- A child may read the tasks assigned to them.
DROP POLICY IF EXISTS tasks_child_read ON public.tasks;
CREATE POLICY tasks_child_read ON public.tasks
  FOR SELECT TO authenticated
  USING (child_id = public.current_child_id());

-- A child may claim a task — and ONLY claim it.
--
-- The WITH CHECK pins the resulting status to 'pending_approval', so a child
-- cannot set 'completed' and award themselves points even by calling the REST
-- API directly with their own token. The approval gate is enforced by the
-- database, not merely by the UI that hides the button.
DROP POLICY IF EXISTS tasks_child_submit ON public.tasks;
CREATE POLICY tasks_child_submit ON public.tasks
  FOR UPDATE TO authenticated
  USING (child_id = public.current_child_id())
  WITH CHECK (
    child_id = public.current_child_id()
    AND status = 'pending_approval'
  );

-- A child may see the rewards available to them.
DROP POLICY IF EXISTS rewards_child_read ON public.rewards;
CREATE POLICY rewards_child_read ON public.rewards
  FOR SELECT TO authenticated
  USING (child_id = public.current_child_id() OR child_id IS NULL);
