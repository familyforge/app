-- Child-submitted task completion.
--
-- Children were previously view-only, so every task transition was performed by
-- the parent. 'pending_approval' is the state a child puts a task into by
-- tapping "I did it!" — outstanding, not yet complete, and awarding no points
-- until a parent approves it.
--
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block in older
-- Postgres, and IF NOT EXISTS makes re-running safe.
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'pending_approval';

-- When the child claimed the task. NULL for anything a parent completed directly.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Parents review these constantly, so keep the lookup cheap.
CREATE INDEX IF NOT EXISTS idx_tasks_pending_approval
  ON tasks (child_id)
  WHERE status = 'pending_approval';
