-- Cloud tables for the last local-only stores.
--
-- Calendar, deadlines, learning and child locations lived exclusively in
-- Zustand + AsyncStorage, so they died with the handset. A parent signing in on
-- a new phone lost every plan, every deadline and all of their children's
-- learning history. These are the tables that make that data portable.
--
-- Conventions carried over from the existing schema:
--   * parent_id scopes ownership; RLS is `parent_id = auth.uid()`
--   * child arrays are stored as uuid[] rather than a join table, matching how
--     the app already models "which children does this apply to"
--   * wall-clock times are TEXT 'HH:mm', never timestamps, so an event at 4pm
--     stays at 4pm through clock changes and travel
--   * every table gets an updated_at so last-write-wins sync has something to
--     compare

-- ===========================================================================
-- CALENDAR
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  color TEXT,
  event_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  all_day BOOLEAN NOT NULL DEFAULT false,
  recurrence TEXT NOT NULL DEFAULT 'none',
  recurrence_end_date DATE,
  child_ids UUID[] NOT NULL DEFAULT '{}',
  is_family BOOLEAN NOT NULL DEFAULT false,
  reminder_minutes INTEGER,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT calendar_start_time_format CHECK (start_time IS NULL OR start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT calendar_end_time_format   CHECK (end_time   IS NULL OR end_time   ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_parent_date
  ON public.calendar_events (parent_id, event_date);

-- ===========================================================================
-- DEADLINES
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE NOT NULL,
  due_time TEXT,
  child_ids UUID[] NOT NULL DEFAULT '{}',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  reminder_days INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT deadlines_due_time_format CHECK (due_time IS NULL OR due_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT deadlines_priority_valid  CHECK (priority IN ('low','medium','high','urgent'))
);

-- Outstanding deadlines are the ones the app queries constantly.
CREATE INDEX IF NOT EXISTS idx_deadlines_parent_due
  ON public.deadlines (parent_id, due_date)
  WHERE is_completed = false;

-- ===========================================================================
-- LEARNING
-- ===========================================================================

-- Definitions a parent sets up. Owned by the parent, applied to children.
CREATE TABLE IF NOT EXISTS public.learning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  points INTEGER NOT NULL DEFAULT 0,
  has_negative_points BOOLEAN NOT NULL DEFAULT false,
  frequency TEXT NOT NULL DEFAULT 'daily',
  days_of_week INTEGER[] NOT NULL DEFAULT '{}',
  time_of_day TEXT,
  applies_to TEXT NOT NULL DEFAULT 'all',
  selected_child_ids UUID[] NOT NULL DEFAULT '{}',
  is_question_based BOOLEAN NOT NULL DEFAULT false,
  questions_per_session INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT learning_time_of_day_format CHECK (time_of_day IS NULL OR time_of_day ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT learning_frequency_valid CHECK (frequency IN ('daily','weekly'))
);

-- One row per child per task per day.
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  task_id UUID,
  category_id TEXT NOT NULL,
  progress_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  gold_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A child cannot have two progress rows for the same task on the same day;
  -- this is what makes sync idempotent instead of duplicating on every push.
  UNIQUE (child_id, task_id, progress_date)
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_child_date
  ON public.learning_progress (child_id, progress_date DESC);

-- Timed exam attempts, which produce the Gold the Kids app displays.
CREATE TABLE IF NOT EXISTS public.learning_exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  academic_year INTEGER,
  session_date DATE NOT NULL,
  -- Per-question detail is a JSON blob: it is written once, read as a whole,
  -- and never queried field by field, so a child table would buy nothing.
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_gold INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  reward_points INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_child
  ON public.learning_exam_sessions (child_id, completed_at DESC);

-- ===========================================================================
-- CHILD LOCATION (Find My Kids)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.child_locations (
  child_id UUID PRIMARY KEY REFERENCES public.children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  battery_level INTEGER,
  status TEXT,
  is_app_installed BOOLEAN NOT NULL DEFAULT false,
  has_permission BOOLEAN NOT NULL DEFAULT false,
  tracking_enabled BOOLEAN NOT NULL DEFAULT false,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================================================
-- RLS — parent owns their rows; children read only what concerns them
-- ===========================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'calendar_events', 'deadlines', 'learning_tasks',
    'learning_progress', 'learning_exam_sessions', 'child_locations'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_parent', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR ALL TO authenticated
        USING (parent_id = auth.uid())
        WITH CHECK (parent_id = auth.uid())
    $f$, t || '_parent', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_read', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I
        FOR SELECT TO authenticated
        USING (public.is_admin_user())
    $f$, t || '_admin_read', t);
  END LOOP;
END $$;

-- A child may read their own learning history and their own calendar and
-- deadlines, which is what the Kids app shows them. They may not write any of
-- it — points and progress stay under parent control.
DROP POLICY IF EXISTS learning_progress_child_read ON public.learning_progress;
CREATE POLICY learning_progress_child_read ON public.learning_progress
  FOR SELECT TO authenticated
  USING (child_id = public.current_child_id());

DROP POLICY IF EXISTS exam_sessions_child_read ON public.learning_exam_sessions;
CREATE POLICY exam_sessions_child_read ON public.learning_exam_sessions
  FOR SELECT TO authenticated
  USING (child_id = public.current_child_id());

DROP POLICY IF EXISTS learning_tasks_child_read ON public.learning_tasks;
CREATE POLICY learning_tasks_child_read ON public.learning_tasks
  FOR SELECT TO authenticated
  USING (
    public.current_child_id() IS NOT NULL
    AND (applies_to = 'all' OR public.current_child_id() = ANY (selected_child_ids))
  );

DROP POLICY IF EXISTS calendar_events_child_read ON public.calendar_events;
CREATE POLICY calendar_events_child_read ON public.calendar_events
  FOR SELECT TO authenticated
  USING (
    public.current_child_id() IS NOT NULL
    AND (is_family OR public.current_child_id() = ANY (child_ids))
  );

DROP POLICY IF EXISTS deadlines_child_read ON public.deadlines;
CREATE POLICY deadlines_child_read ON public.deadlines
  FOR SELECT TO authenticated
  USING (
    public.current_child_id() IS NOT NULL
    AND public.current_child_id() = ANY (child_ids)
  );
