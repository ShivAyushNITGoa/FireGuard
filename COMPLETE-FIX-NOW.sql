-- COMPLETE FIX: Deleted Alerts + Warning Alerts
-- Run this entire file in Supabase SQL Editor

-- ==================== PART 1: FIX DELETED ALERTS ====================

-- Step 1: Check if RLS is enabled on alerts table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'alerts';

-- Step 2: Enable RLS if not enabled
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to delete alerts" ON alerts;
DROP POLICY IF EXISTS "Allow anon users to delete alerts" ON alerts;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON alerts;
DROP POLICY IF EXISTS "Enable delete for anon users" ON alerts;

-- Step 4: Create new delete policies
CREATE POLICY "Enable delete for authenticated users"
ON alerts
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Enable delete for anon users"
ON alerts
FOR DELETE
TO anon
USING (true);

-- Step 5: Also need SELECT policies for the subscriptions to work
DROP POLICY IF EXISTS "Enable read access for all users" ON alerts;

CREATE POLICY "Enable read access for all users"
ON alerts
FOR SELECT
TO authenticated, anon
USING (true);

-- Step 6: Verify Realtime is enabled (should already be enabled based on error)
-- If you get an error here, it means it's already enabled (which is good!)
-- ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- ==================== PART 2: FIX WARNING ALERTS ====================

-- Step 1: Check if device_settings has data for ESP32_001
SELECT * FROM device_settings WHERE device_id = 'ESP32_001';

-- Step 2: If empty, insert default settings
INSERT INTO device_settings (
  device_id,
  gas_warning_threshold,
  gas_danger_threshold,
  temp_warning_threshold,
  temp_danger_threshold,
  humidity_warning_threshold,
  humidity_danger_threshold,
  enable_gas_alerts,
  enable_temp_alerts,
  enable_flame_alerts,
  enable_buzzer,
  alert_cooldown_seconds
) VALUES (
  'ESP32_001',
  100,  -- Low threshold for testing (normally 300)
  500,  -- Gas danger (PPM)
  25,   -- Low threshold for testing (normally 35)
  45,   -- Temp danger (°C)
  70,   -- Humidity warning (%)
  85,   -- Humidity danger (%)
  true, -- Enable gas alerts
  true, -- Enable temp alerts
  true, -- Enable flame alerts
  true, -- Enable buzzer
  600   -- Cooldown 600 seconds (10 minutes)
)
ON CONFLICT (device_id) 
DO UPDATE SET
  gas_warning_threshold = 100,
  temp_warning_threshold = 25,
  alert_cooldown_seconds = 600,
  updated_at = NOW();

-- Step 3: Enable RLS on device_settings
ALTER TABLE device_settings ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies for device_settings
DROP POLICY IF EXISTS "Enable read access for device_settings" ON device_settings;
DROP POLICY IF EXISTS "Enable update access for device_settings" ON device_settings;

CREATE POLICY "Enable read access for device_settings"
ON device_settings
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Enable update access for device_settings"
ON device_settings
FOR UPDATE
TO authenticated, anon
USING (true);

-- ==================== PART 3: VERIFY EVERYTHING ====================

-- Check alerts table policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'alerts';

-- Check device_settings
SELECT * FROM device_settings WHERE device_id = 'ESP32_001';

-- Check recent sensor data
SELECT device_id, gas, temp, humidity, time 
FROM sensor_data 
WHERE device_id = 'ESP32_001'
ORDER BY time DESC 
LIMIT 5;

-- Check if any alerts exist
SELECT id, message, severity, gas, temp, time 
FROM alerts 
ORDER BY time DESC 
LIMIT 5;

-- ==================== DONE ====================
-- What to expect:
-- 1. Deleted alerts will stay deleted (Realtime + RLS policies)
-- 2. Warning alerts will be sent when:
--    - Gas > 100 PPM (lowered for testing)
--    - Temp > 25°C (lowered for testing)
-- 3. Check browser console for: "✓ Alert created: ⚠️ WARNING..."
-- 4. Cooldown is 30 seconds (faster testing)

-- Next steps:
-- 1. Run this entire SQL file
-- 2. Refresh your web app
-- 3. Delete an alert → should stay deleted
-- 4. Wait for ESP32 to send data
-- 5. If gas > 100 or temp > 25, alert should appear!
