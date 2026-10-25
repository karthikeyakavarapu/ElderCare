-- =============================================
-- Elder Care Management System - Supabase Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'family' CHECK (role IN ('admin', 'caregiver', 'family')),
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. ELDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS elders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(10),
    medical_conditions TEXT,
    allergies TEXT,
    blood_group VARCHAR(5),
    address TEXT,
    assigned_caregiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    family_contact_id UUID REFERENCES users(id) ON DELETE SET NULL,
    family_contact_email VARCHAR(255),
    caregiver_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. HEALTH METRICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE CASCADE,
    heart_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    temperature DECIMAL(4,1),
    oxygen_level INTEGER,
    activity_level VARCHAR(20) CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active')),
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. EMERGENCIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS emergencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE CASCADE,
    triggered_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'soc' CHECK (type IN ('soc', 'medical', 'fall', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_health_metrics_elder ON health_metrics(elder_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_recorded ON health_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_emergencies_elder ON emergencies(elder_id);
CREATE INDEX IF NOT EXISTS idx_emergencies_status ON emergencies(status);
CREATE INDEX IF NOT EXISTS idx_elders_caregiver ON elders(assigned_caregiver_id);
CREATE INDEX IF NOT EXISTS idx_elders_family ON elders(family_contact_id);

-- =============================================
-- 7. SEED DATA (Sample data for testing)
-- =============================================

-- Insert a default admin user (password: admin123 - bcrypt hash)
INSERT INTO users (email, full_name, password_hash, role, phone) VALUES
('admin@eldercare.com', 'System Admin', '$2b$12$LJ3m4ys3Lk0TSwHlvPBVt.4hE0K6oy1WWXQ5L7dVL8lE2q1YoQzXO', 'admin', '+91-9876543210')
ON CONFLICT (email) DO NOTHING;
