-- Parent avatar, onboarding answers, and "about me" facts a child shares.
--
-- Two columns the app has ALWAYS written but which never existed:
--
--   avatar_url      — syncParentToCloud and the onboarding completion handler
--                     both send it
--   onboarding_data — the completion handler sends every answer from the 24
--                     onboarding screens
--
-- PostgREST rejects a write naming an unknown column, so these did not fail
-- partially — they failed the ENTIRE parent upsert. That is why a parent's name
-- and picture never appeared on a second device, and why 24 screens of answers
-- about fears, hopes and goals were collected and then thrown away.

ALTER TABLE public.parents ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Everything onboarding asked: parentType, painPoints, emotionalTrigger,
-- guiltReflection, fixOneThing, childWorry, parentFear, hopeChange, commitment,
-- parentStrength. Kept as JSONB because the question set will keep changing and
-- a column per answer would need a migration each time.
ALTER TABLE public.parents ADD COLUMN IF NOT EXISTS onboarding_data JSONB;

-- The six-month hope is promoted out of the blob because it is read on a timer
-- for the re-engagement reminder, and that should not deserialise the whole
-- onboarding payload every time.
ALTER TABLE public.parents ADD COLUMN IF NOT EXISTS six_month_goal TEXT;

-- ===========================================================================
-- CHILD "ABOUT ME"
-- ===========================================================================
--
-- Things a child chooses to tell their family. Key/value rather than a column
-- per fact so new prompts can be added without a migration, and so a child can
-- skip anything they do not want to answer.
--
-- This is deliberately child-writable. It is the one place in the app where a
-- child contributes rather than consumes, and the parent-facing value is real:
-- "something I find hard" surfaces worries a child may not raise out loud.
CREATE TABLE IF NOT EXISTS public.child_about (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One answer per prompt per child, so saving again edits rather than appends.
  UNIQUE (child_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_child_about_child ON public.child_about (child_id);

ALTER TABLE public.child_about ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.child_about FROM anon;

-- A parent may read and manage their own children's answers.
DROP POLICY IF EXISTS child_about_parent ON public.child_about;
CREATE POLICY child_about_parent ON public.child_about
  FOR ALL TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- A child may read and write their OWN answers, and nobody else's. This is the
-- only table in the schema a child can write freely — it holds nothing that
-- affects points, rewards or approval.
DROP POLICY IF EXISTS child_about_child ON public.child_about;
CREATE POLICY child_about_child ON public.child_about
  FOR ALL TO authenticated
  USING (child_id = public.current_child_id())
  WITH CHECK (child_id = public.current_child_id());

DROP POLICY IF EXISTS child_about_admin_read ON public.child_about;
CREATE POLICY child_about_admin_read ON public.child_about
  FOR SELECT TO authenticated
  USING (public.is_admin_user());
