-- FireGuard Database Schema - Verification & Status Check
-- This script checks what's already fixed and what still needs fixing
-- Run this in Supabase SQL Editor

SELECT '🔍 DATABASE SCHEMA VERIFICATION' AS section;
SELECT '' AS blank;

-- ==================== CHECK 1: sensor_data ====================
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ sensor_data.device_id FK EXISTS'
    ELSE '❌ sensor_data.device_id FK MISSING'
  END as check_1
FROM information_schema.table_constraints
WHERE table_name = 'sensor_data' 
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name = 'sensor_data_device_id_fkey';

-- ==================== CHECK 2: alerts.device_id ====================
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ alerts.device_id FK EXISTS'
    ELSE '❌ alerts.device_id FK MISSING'
  END as check_2
FROM information_schema.table_constraints
WHERE table_name = 'alerts' 
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name = 'alerts_device_id_fkey';

-- ==================== CHECK 3: alerts.acknowledged_by ====================
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ alerts.acknowledged_by FK EXISTS'
    ELSE '❌ alerts.acknowledged_by FK MISSING'
  END as check_3
FROM information_schema.table_constraints
WHERE table_name = 'alerts' 
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name = 'alerts_acknowledged_by_fkey';

-- ==================== CHECK 4: alerts.acknowledged_by TYPE ====================
SELECT 
  CASE 
    WHEN data_type = 'uuid' THEN '✅ alerts.acknowledged_by is UUID'
    ELSE '⚠️ alerts.acknowledged_by is ' || data_type || ' (should be UUID)'
  END as check_4
FROM information_schema.columns
WHERE table_name = 'alerts' 
  AND column_name = 'acknowledged_by';

-- ==================== CHECK 5: notification_preferences.user_id ====================
SELECT 
  CASE 
    WHEN data_type = 'uuid' THEN '✅ notification_preferences.user_id is UUID'
    ELSE '⚠️ notification_preferences.user_id is ' || data_type || ' (should be UUID)'
  END as check_5
FROM information_schema.columns
WHERE table_name = 'notification_preferences' 
  AND column_name = 'user_id';

-- ==================== CHECK 6: system_events.user_id ====================
SELECT 
  CASE 
    WHEN data_type = 'uuid' THEN '✅ system_events.user_id is UUID'
    ELSE '⚠️ system_events.user_id is ' || data_type || ' (should be UUID)'
  END as check_6
FROM information_schema.columns
WHERE table_name = 'system_events' 
  AND column_name = 'user_id';

-- ==================== CHECK 7: alert_pattern_devices TABLE ====================
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ alert_pattern_devices junction table EXISTS'
    ELSE '❌ alert_pattern_devices junction table MISSING'
  END as check_7
FROM information_schema.tables
WHERE table_name = 'alert_pattern_devices' 
  AND table_schema = 'public';

-- ==================== CHECK 8: Indexes ====================
SELECT 
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ Performance indexes created (' || COUNT(*) || ' indexes)'
    ELSE '⚠️ Only ' || COUNT(*) || ' indexes found (expected 20+)'
  END as check_8
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('sensor_data', 'alerts', 'system_events', 'notification_preferences');

-- ==================== SUMMARY ====================
SELECT '' AS blank;
SELECT '📊 SUMMARY:' AS summary;
SELECT 'If all checks show ✅, your database is properly fixed!' AS status;
SELECT 'If you see ⚠️ or ❌, run the remaining fixes below.' AS action;
SELECT '' AS blank;

-- ==================== REMAINING FIXES ====================
-- Only run these if the checks above show issues

-- FIX: If alerts.acknowledged_by is still TEXT, convert it
-- (Only run if check_4 shows it's not UUID)
/*
DELETE FROM alerts 
WHERE acknowledged_by IS NOT NULL 
  AND acknowledged_by !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

ALTER TABLE alerts 
ALTER COLUMN acknowledged_by TYPE uuid USING NULLIF(acknowledged_by, '')::uuid;

ALTER TABLE alerts 
ADD CONSTRAINT alerts_acknowledged_by_fkey 
FOREIGN KEY (acknowledged_by) REFERENCES user_profiles(id) ON DELETE SET NULL;
*/

-- FIX: If notification_preferences.user_id is still TEXT, convert it
-- (Only run if check_5 shows it's not UUID)
/*
ALTER TABLE notification_preferences 
DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;

DELETE FROM notification_preferences 
WHERE user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

ALTER TABLE notification_preferences 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

ALTER TABLE notification_preferences 
ADD CONSTRAINT notification_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
*/

-- FIX: If system_events.user_id is still TEXT, convert it
-- (Only run if check_6 shows it's not UUID)
/*
ALTER TABLE system_events 
DROP CONSTRAINT IF EXISTS system_events_user_id_fkey;
ALTER TABLE system_events 
DROP CONSTRAINT IF EXISTS system_events_device_id_fkey;

DELETE FROM system_events 
WHERE user_id IS NOT NULL 
  AND user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

ALTER TABLE system_events 
ALTER COLUMN user_id TYPE uuid USING NULLIF(user_id, '')::uuid;

ALTER TABLE system_events 
ADD CONSTRAINT system_events_device_id_fkey 
FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE;

ALTER TABLE system_events 
ADD CONSTRAINT system_events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL;
*/

-- FIX: If alert_pattern_devices doesn't exist, create it
-- (Only run if check_7 shows it's missing)
/*
CREATE TABLE IF NOT EXISTS alert_pattern_devices (
  pattern_id uuid NOT NULL REFERENCES alert_patterns(id) ON DELETE CASCADE,
  device_id text NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  PRIMARY KEY (pattern_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_alert_pattern_devices_device ON alert_pattern_devices(device_id);
*/

SELECT '' AS blank;
SELECT '✅ Verification complete!' AS done;
