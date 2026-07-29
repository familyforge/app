-- Optional per-task deadlines.
--
-- The Task TypeScript interface has carried `startTime` and `endTime` since the
-- beginning, but the columns were never created — so the auto-miss logic in
-- tasks.tsx has always read fields that could not survive a round trip to the
-- database. This adds them for real.
--
-- Deadlines are OPTIONAL by design: a parent decides per task whether one
-- applies. NULL means "no deadline", and the Kids app shows no countdown at all
-- rather than inventing one.

-- HH:mm local wall-clock times, deliberately not timestamps. A chore due
-- "before 6:30pm" means 6:30pm wherever the family is, and must not shift when
-- they travel or when the clocks change.
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Guard the format so a malformed value can never reach the countdown, which
-- would otherwise render NaN at a child.
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_start_time_format;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_start_time_format
  CHECK (start_time IS NULL OR start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_end_time_format;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_end_time_format
  CHECK (end_time IS NULL OR end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

-- Only tasks with a deadline are worth indexing for the "due soon" lookups the
-- child dashboard and reminder scheduling both want.
CREATE INDEX IF NOT EXISTS idx_tasks_deadline
  ON public.tasks (child_id, due_date)
  WHERE end_time IS NOT NULL;
