-- Who the child actually calls this person.
--
-- The Kids app said "your grown-up" everywhere, which is placeholder copy
-- pretending to be finished. A child knows Dad, Mum, Grandad, Nanny — not
-- "a grown-up".
--
-- Labels are DENORMALISED onto children and tasks on purpose. A child cannot
-- read the `parents` table (RLS, migration 013), so the label has to travel with
-- data the child is allowed to see. Copying it also snapshots attribution: if
-- Grandad set a task, it keeps saying Grandad even after he stops being the
-- one issuing codes.

ALTER TABLE public.parents
  ADD COLUMN IF NOT EXISTS caregiver_label TEXT;

-- What this child calls their primary caregiver. Kept in step with the parent's
-- own label by the trigger below.
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS caregiver_label TEXT;

-- Who set this particular task, captured at creation time.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS assigned_by_label TEXT;

-- Seed sensible defaults from what onboarding already collected. `role` on
-- parents is a coarse field, so gender-derived guesses are only applied where
-- they are unambiguous; everything else is left NULL and falls back in the UI.
-- `role` is an enum, so it must be cast to text before comparing against a
-- literal — coalescing an enum with '' raises invalid_text_representation.
UPDATE public.parents
   SET caregiver_label = CASE
     WHEN lower(coalesce(role::text, '')) = 'father' THEN 'Dad'
     WHEN lower(coalesce(role::text, '')) = 'mother' THEN 'Mum'
     ELSE NULL
   END
 WHERE caregiver_label IS NULL;

-- Keep the child's copy in step whenever a parent renames themselves.
CREATE OR REPLACE FUNCTION public.sync_caregiver_label()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.children
     SET caregiver_label = NEW.caregiver_label
   WHERE parent_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_caregiver_label ON public.parents;
CREATE TRIGGER trg_sync_caregiver_label
  AFTER UPDATE OF caregiver_label ON public.parents
  FOR EACH ROW
  WHEN (NEW.caregiver_label IS DISTINCT FROM OLD.caregiver_label)
  EXECUTE FUNCTION public.sync_caregiver_label();

-- Backfill children from their parent's label.
UPDATE public.children c
   SET caregiver_label = p.caregiver_label
  FROM public.parents p
 WHERE c.parent_id = p.id
   AND c.caregiver_label IS DISTINCT FROM p.caregiver_label;
