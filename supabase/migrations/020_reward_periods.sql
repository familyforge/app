-- Rewards that run over a period, or unlock at a gold total.
--
-- `rewards` could only express "costs N points". A parent also wants to say
-- "best week gets a cinema trip" or "reach 500 gold and you get the bike" —
-- which are different shapes: one is a recurring window, the other a milestone
-- against a lifetime total.

-- How this reward is earned:
--   spend       — the original behaviour: exchange points for it
--   daily .. yearly — earned within a recurring window
--   gold_target — unlocks once the child's all-time gold reaches a threshold
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS reward_period TEXT NOT NULL DEFAULT 'spend';

ALTER TABLE public.rewards DROP CONSTRAINT IF EXISTS rewards_period_valid;
ALTER TABLE public.rewards ADD CONSTRAINT rewards_period_valid
  CHECK (reward_period IN ('spend', 'daily', 'weekly', 'monthly', 'yearly', 'gold_target'));

-- Gold needed for a 'gold_target' reward. Ignored for every other kind.
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS gold_target INTEGER;

-- points_required was NOT NULL, which only made sense when every reward was
-- bought with points. A milestone reward ("reach 500 gold") has a target rather
-- than a price, so the column has to be optional.
ALTER TABLE public.rewards ALTER COLUMN points_required DROP NOT NULL;

ALTER TABLE public.rewards DROP CONSTRAINT IF EXISTS rewards_gold_target_valid;
ALTER TABLE public.rewards ADD CONSTRAINT rewards_gold_target_valid
  CHECK (
    (reward_period = 'gold_target' AND gold_target IS NOT NULL AND gold_target > 0)
    OR (reward_period <> 'gold_target')
  );

-- Owner, so a parent's rewards survive a device change even before any child is
-- assigned. Existing rows are backfilled from the child they belong to.
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE;

UPDATE public.rewards r
   SET parent_id = c.parent_id
  FROM public.children c
 WHERE r.child_id = c.id
   AND r.parent_id IS NULL;

ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- The child's Rewards screen groups by period, so that is the access pattern.
CREATE INDEX IF NOT EXISTS idx_rewards_child_period
  ON public.rewards (child_id, reward_period);

-- A reward with no child_id applies to every child in the family. The existing
-- child read policy (migration 014) already allows `child_id IS NULL`, so
-- family-wide rewards are visible without further change.
