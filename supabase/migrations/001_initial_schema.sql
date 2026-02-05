-- Pro Parenting App - Initial Database Schema
-- Supabase PostgreSQL Migration
-- Run this in Supabase SQL Editor or via migrations

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE task_type AS ENUM ('chore', 'exercise', 'personal_care');
CREATE TYPE task_status AS ENUM ('pending', 'completed', 'skipped');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
CREATE TYPE theme_type AS ENUM ('dark', 'light', 'system');
CREATE TYPE user_role AS ENUM ('parent', 'admin', 'superadmin');

-- ============================================
-- TABLES
-- ============================================

-- Parents table (linked to Supabase Auth)
CREATE TABLE parents (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '',
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    role user_role NOT NULL DEFAULT 'parent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Children table
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    picture TEXT,
    avatar TEXT,
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 18),
    class TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type task_type NOT NULL DEFAULT 'chore',
    category TEXT NOT NULL DEFAULT 'chore',
    points INTEGER NOT NULL DEFAULT 0,
    negative_points INTEGER NOT NULL DEFAULT 0,
    status task_status NOT NULL DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Rewards table
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    points_required INTEGER NOT NULL DEFAULT 0,
    redeemed BOOLEAN NOT NULL DEFAULT FALSE,
    redeemed_by_child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    date_earned TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    redeemed_at TIMESTAMPTZ
);

-- Exercises table
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    points_per_question INTEGER NOT NULL DEFAULT 1,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    marked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    points_earned INTEGER NOT NULL DEFAULT 0,
    rewards_redeemed INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(child_id, date)
);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID UNIQUE NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    theme theme_type NOT NULL DEFAULT 'dark',
    notifications BOOLEAN NOT NULL DEFAULT TRUE,
    reminders BOOLEAN NOT NULL DEFAULT TRUE,
    points_to_money_rate DECIMAL(10,2) NOT NULL DEFAULT 0.01,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Offline sync queue table
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    synced BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

-- Parents indexes
CREATE INDEX idx_parents_email ON parents(email);
CREATE INDEX idx_parents_role ON parents(role);

-- Children indexes
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_children_name ON children(name);

-- Tasks indexes
CREATE INDEX idx_tasks_child_id ON tasks(child_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Rewards indexes
CREATE INDEX idx_rewards_child_id ON rewards(child_id);
CREATE INDEX idx_rewards_redeemed ON rewards(redeemed);
CREATE INDEX idx_rewards_points_required ON rewards(points_required);

-- Exercises indexes
CREATE INDEX idx_exercises_child_id ON exercises(child_id);
CREATE INDEX idx_exercises_completed ON exercises(completed);
CREATE INDEX idx_exercises_subject ON exercises(subject);

-- Reports indexes
CREATE INDEX idx_reports_child_id ON reports(child_id);
CREATE INDEX idx_reports_date ON reports(date);

-- Settings indexes
CREATE INDEX idx_settings_parent_id ON settings(parent_id);

-- Sync queue indexes
CREATE INDEX idx_sync_queue_parent_id ON sync_queue(parent_id);
CREATE INDEX idx_sync_queue_synced ON sync_queue(synced);
CREATE INDEX idx_sync_queue_created_at ON sync_queue(created_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_parents_updated_at
    BEFORE UPDATE ON parents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at
    BEFORE UPDATE ON children
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get child statistics
CREATE OR REPLACE FUNCTION get_child_stats(child_uuid UUID)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    total_points INTEGER,
    rewards_redeemed BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM tasks WHERE child_id = child_uuid) AS total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE child_id = child_uuid AND status = 'completed') AS completed_tasks,
        (SELECT COALESCE(points, 0) FROM children WHERE id = child_uuid) AS total_points,
        (SELECT COUNT(*) FROM rewards WHERE redeemed_by_child_id = child_uuid AND redeemed = TRUE) AS rewards_redeemed;
END;
$$ LANGUAGE plpgsql;

-- Function to get parent analytics
CREATE OR REPLACE FUNCTION get_parent_analytics(parent_uuid UUID)
RETURNS TABLE (
    total_children BIGINT,
    total_tasks_completed BIGINT,
    total_points_earned BIGINT,
    total_rewards_redeemed BIGINT,
    completion_rate DECIMAL
) AS $$
DECLARE
    child_ids UUID[];
    total_tasks BIGINT;
    completed BIGINT;
BEGIN
    -- Get all child IDs for this parent
    SELECT ARRAY_AGG(id) INTO child_ids FROM children WHERE parent_id = parent_uuid;
    
    -- Calculate totals
    SELECT COUNT(*) INTO total_tasks FROM tasks WHERE child_id = ANY(child_ids);
    SELECT COUNT(*) INTO completed FROM tasks WHERE child_id = ANY(child_ids) AND status = 'completed';
    
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM children WHERE parent_id = parent_uuid) AS total_children,
        completed AS total_tasks_completed,
        (SELECT COALESCE(SUM(points), 0) FROM children WHERE parent_id = parent_uuid) AS total_points_earned,
        (SELECT COUNT(*) FROM rewards WHERE redeemed_by_child_id = ANY(child_ids) AND redeemed = TRUE) AS total_rewards_redeemed,
        CASE WHEN total_tasks > 0 THEN (completed::DECIMAL / total_tasks::DECIMAL * 100) ELSE 0 END AS completion_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to update child points on task completion
CREATE OR REPLACE FUNCTION update_child_points_on_task()
RETURNS TRIGGER AS $$
BEGIN
    -- If task was completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE children
        SET points = points + NEW.points
        WHERE id = NEW.child_id;
    END IF;
    
    -- If task was uncompleted (reverted)
    IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        UPDATE children
        SET points = points - OLD.points
        WHERE id = NEW.child_id;
    END IF;
    
    -- If task was skipped, apply negative points
    IF NEW.status = 'skipped' AND OLD.status = 'pending' THEN
        UPDATE children
        SET points = GREATEST(0, points - NEW.negative_points)
        WHERE id = NEW.child_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_child_points
    AFTER UPDATE OF status ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_child_points_on_task();

-- Function to deduct points on reward redemption
CREATE OR REPLACE FUNCTION deduct_points_on_reward_redemption()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.redeemed = TRUE AND OLD.redeemed = FALSE AND NEW.redeemed_by_child_id IS NOT NULL THEN
        UPDATE children
        SET points = points - NEW.points_required
        WHERE id = NEW.redeemed_by_child_id AND points >= NEW.points_required;
        
        -- Check if deduction was successful
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Insufficient points for reward redemption';
        END IF;
        
        NEW.redeemed_at = NOW();
        NEW.date_earned = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deduct_points_on_redemption
    BEFORE UPDATE OF redeemed ON rewards
    FOR EACH ROW
    EXECUTE FUNCTION deduct_points_on_reward_redemption();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Parents policies
CREATE POLICY "Users can view own profile" ON parents
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON parents
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all parents" ON parents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Children policies
CREATE POLICY "Parents can view own children" ON children
    FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert own children" ON children
    FOR INSERT WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own children" ON children
    FOR UPDATE USING (parent_id = auth.uid());

CREATE POLICY "Parents can delete own children" ON children
    FOR DELETE USING (parent_id = auth.uid());

CREATE POLICY "Admins can view all children" ON children
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Tasks policies
CREATE POLICY "Parents can manage tasks for own children" ON tasks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM children WHERE children.id = tasks.child_id AND children.parent_id = auth.uid())
    );

CREATE POLICY "Admins can view all tasks" ON tasks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Rewards policies
CREATE POLICY "Parents can manage rewards for own children" ON rewards
    FOR ALL USING (
        child_id IS NULL OR
        EXISTS (SELECT 1 FROM children WHERE children.id = rewards.child_id AND children.parent_id = auth.uid())
    );

CREATE POLICY "Admins can manage all rewards" ON rewards
    FOR ALL USING (
        EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Exercises policies
CREATE POLICY "Parents can manage exercises for own children" ON exercises
    FOR ALL USING (
        EXISTS (SELECT 1 FROM children WHERE children.id = exercises.child_id AND children.parent_id = auth.uid())
    );

-- Reports policies
CREATE POLICY "Parents can view reports for own children" ON reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM children WHERE children.id = reports.child_id AND children.parent_id = auth.uid())
    );

CREATE POLICY "Parents can insert reports for own children" ON reports
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM children WHERE children.id = reports.child_id AND children.parent_id = auth.uid())
    );

-- Settings policies
CREATE POLICY "Users can manage own settings" ON settings
    FOR ALL USING (parent_id = auth.uid());

-- Sync queue policies
CREATE POLICY "Users can manage own sync queue" ON sync_queue
    FOR ALL USING (parent_id = auth.uid());

-- ============================================
-- INITIAL DATA (Optional - for testing)
-- ============================================

-- Note: Run these manually in Supabase SQL Editor for testing
-- INSERT INTO parents (id, email, name, password_hash, role)
-- VALUES ('your-auth-user-id', 'admin@proparenting.com', 'Admin User', '', 'admin');
