-- FireGuard: Remove all devices except the original (first registered)
-- This script keeps only the oldest device and removes all others

-- Step 1: Identify the original device (oldest by created_at)
-- Run this first to see which device will be kept
SELECT id, name, device_id, created_at 
FROM devices 
ORDER BY created_at ASC;

-- Step 2: Delete all devices EXCEPT the original one
-- WARNING: This will permanently delete all other devices
DELETE FROM devices 
WHERE id != (
  SELECT id FROM devices 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Step 3: Verify only original device remains
SELECT id, name, device_id, created_at, status, last_seen
FROM devices 
ORDER BY created_at ASC;

-- Step 4 (Optional): Clean up orphaned health data for deleted devices
DELETE FROM device_health 
WHERE device_id NOT IN (
  SELECT device_id FROM devices
);

-- Step 5 (Optional): Clean up orphaned sensor data for deleted devices
DELETE FROM sensor_data 
WHERE device_id NOT IN (
  SELECT device_id FROM devices
);

-- Step 6 (Optional): Clean up orphaned alerts for deleted devices
DELETE FROM alerts 
WHERE device_id NOT IN (
  SELECT device_id FROM devices
);

-- Final verification
SELECT 'Devices' as table_name, COUNT(*) as count FROM devices
UNION ALL
SELECT 'Device Health', COUNT(*) FROM device_health
UNION ALL
SELECT 'Sensor Data', COUNT(*) FROM sensor_data
UNION ALL
SELECT 'Alerts', COUNT(*) FROM alerts;
