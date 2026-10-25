-- =============================================
-- Create care_tasks and medicines tables if they don't exist
-- Run this in Supabase SQL Editor
-- =============================================

-- ── CARE TASKS TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS care_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE CASCADE,
    task_name VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_tasks_elder ON care_tasks(elder_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_status ON care_tasks(status);

-- ── MEDICINES TABLE ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    time VARCHAR(200),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicines_elder ON medicines(elder_id);
CREATE INDEX IF NOT EXISTS idx_medicines_status ON medicines(status);
