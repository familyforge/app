-- One-time sign-in codes for children.
--
-- A child signs in with their FIRST NAME plus a 6-digit code the parent
-- generates in the parent app. The code is single-use and expires 120 seconds
-- after it is issued.
--
-- Why a code rather than a password: children should not have to remember or
-- type credentials, and a parent handing over a short-lived code keeps the
-- parent in control of when a device gets access.

CREATE TABLE IF NOT EXISTS public.child_login_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  -- Brute force is already impractical (10^6 codes in a 120s window) but a
  -- counter lets a code be burned after repeated failures rather than staying
  -- guessable for its whole life.
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Redemption looks a code up directly, so this is the hot path.
CREATE INDEX IF NOT EXISTS idx_child_login_codes_code
  ON public.child_login_codes (code)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_child_login_codes_child
  ON public.child_login_codes (child_id, created_at DESC);

ALTER TABLE public.child_login_codes ENABLE ROW LEVEL SECURITY;

-- The anon role must never touch this table. Redemption happens in an Edge
-- Function using the service role, which bypasses RLS entirely.
REVOKE ALL ON public.child_login_codes FROM anon;

-- A parent may issue and view codes for their own children only.
DROP POLICY IF EXISTS child_login_codes_parent ON public.child_login_codes;
CREATE POLICY child_login_codes_parent ON public.child_login_codes
  FOR ALL TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (
    parent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_id AND c.parent_id = auth.uid()
    )
  );

-- Issue a code, invalidating any earlier unused ones for the same child so only
-- the most recent code is ever live.
CREATE OR REPLACE FUNCTION public.issue_child_login_code(p_child_id UUID)
RETURNS TABLE (code TEXT, expires_at TIMESTAMPTZ, child_name TEXT)
LANGUAGE plpgsql
SECURITY INVOKER            -- runs as the caller, so RLS above still applies
SET search_path = public
AS $$
DECLARE
  v_parent UUID;
  v_name   TEXT;
  v_code   TEXT;
  v_expiry TIMESTAMPTZ;
BEGIN
  SELECT c.parent_id, c.name INTO v_parent, v_name
  FROM public.children c
  WHERE c.id = p_child_id;

  IF v_parent IS NULL OR v_parent <> auth.uid() THEN
    RAISE EXCEPTION 'not your child';
  END IF;

  UPDATE public.child_login_codes
     SET used_at = NOW()
   WHERE child_id = p_child_id AND used_at IS NULL;

  v_code   := lpad((floor(random() * 1000000))::int::text, 6, '0');
  v_expiry := NOW() + INTERVAL '120 seconds';

  INSERT INTO public.child_login_codes (child_id, parent_id, code, expires_at)
  VALUES (p_child_id, v_parent, v_code, v_expiry);

  RETURN QUERY SELECT v_code, v_expiry, v_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_child_login_code(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.issue_child_login_code(UUID) FROM anon;
