-- Insert Device Settings for ESP32_001
-- This will enable alerts with 10-minute cooldown

-- First, check if settings already exist
SELECT * FROM device_settings WHERE device_id = 'ESP32_001';

-- Delete existing settings (if any) to start fresh
DELETE FROM device_settings WHERE device_id = 'ESP32_001';

-- Insert new settings with 10-minute cooldown
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
  100,   -- Gas warning (low for testing)
  500,   -- Gas danger
  25,    -- Temp warning (low for testing)
  45,    -- Temp danger
  70,    -- Humidity warning
  85,    -- Humidity danger
  true,  -- Enable gas alerts
  true,  -- Enable temp alerts
  true,  -- Enable flame alerts
  true,  -- Enable buzzer
  600    -- 10 minutes cooldown
);

-- Verify the insert
SELECT 
  device_id,
  gas_warning_threshold,
  temp_warning_threshold,
  humidity_warning_threshold,
  alert_cooldown_seconds,
  alert_cooldown_seconds / 60 as cooldown_minutes
FROM device_settings 
WHERE device_id = 'ESP32_001';

-- Expected result:
-- device_id: ESP32_001
-- gas_warning_threshold: 100
-- temp_warning_threshold: 25
-- humidity_warning_threshold: 70
-- alert_cooldown_seconds: 600
-- cooldown_minutes: 10
