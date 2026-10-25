-- =============================================
-- RUN THIS FIRST to clean up old tables
-- Then run supabase_schema.sql after this
-- =============================================

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS emergencies CASCADE;
DROP TABLE IF EXISTS health_metrics CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS elders CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop old indexes (just in case)
DROP INDEX IF EXISTS idx_health_metrics_elder;
DROP INDEX IF EXISTS idx_health_metrics_recorded;
DROP INDEX IF EXISTS idx_messages_sender;
DROP INDEX IF EXISTS idx_emergencies_elder;
DROP INDEX IF EXISTS idx_emergencies_status;
DROP INDEX IF EXISTS idx_elders_caregiver;
DROP INDEX IF EXISTS idx_elders_family;
