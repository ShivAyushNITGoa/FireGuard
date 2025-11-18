-- FireGuard SMS Alerts via CircuitDigest Cloud API
-- This script sets up SMS alerts triggered directly from Supabase
-- Run this in Supabase SQL Editor

-- ==================== STEP 1: Enable HTTP Extension ====================
-- Check if HTTP extension is enabled
SELECT 'Checking HTTP extension...' AS step;

CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

SELECT '✅ HTTP extension enabled' AS status;

-- ==================== STEP 2: Add Phone Number Column ====================
-- Add phone_number column to user_profiles if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone_number text;

SELECT '✅ Phone number column ready' AS status;

-- ==================== STEP 3: Create SMS Alert Function ====================
-- This function sends SMS via CircuitDigest Cloud API when an alert is created

CREATE OR REPLACE FUNCTION send_sms_alert()
RETURNS TRIGGER AS $$
DECLARE
  circuitdigest_api_url TEXT := 'https://api.circuitdigest.com/sms/send';
  circuitdigest_api_key TEXT := 'rOwEUEDsPAz7';
  request_id BIGINT;
  phone_number TEXT;
  sms_message TEXT;
  user_email TEXT;
BEGIN
  -- Get phone number and email from user_profiles
  SELECT phone_number, email INTO phone_number, user_email
  FROM user_profiles
  WHERE receive_alerts = true
  LIMIT 1;
  
  -- If no phone number, skip SMS (email will still be sent via Zapier)
  IF phone_number IS NULL THEN
    RAISE NOTICE 'No phone number found for SMS alert %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Format SMS message (keep it short for SMS)
  sms_message := 'FireGuard Alert: ' || 
                 UPPER(NEW.severity) || ' - ' || 
                 NEW.message || 
                 ' [' || COALESCE(NEW.location, 'Building A - Floor 1') || ']';
  
  -- Send SMS via CircuitDigest API
  BEGIN
    SELECT net.http_post(
      url := circuitdigest_api_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || circuitdigest_api_key
      ),
      body := jsonb_build_object(
        'phone_number', phone_number,
        'message', sms_message,
        'alert_id', NEW.id::text,
        'device_id', NEW.device_id,
        'severity', NEW.severity,
        'timestamp', COALESCE(NEW.time, NOW())::text
      )
    ) INTO request_id;
    
    RAISE NOTICE 'SMS sent to % for alert % (Request ID: %)', phone_number, NEW.id, request_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SMS send failed for alert %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ SMS alert function created' AS status;

-- ==================== STEP 4: Create SMS Trigger ====================
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_alert_send_sms ON alerts;

-- Create trigger that fires after each alert insert
CREATE TRIGGER on_alert_send_sms
  AFTER INSERT ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION send_sms_alert();

SELECT '✅ SMS alert trigger created' AS status;

-- ==================== STEP 5: Update Your Phone Number ====================
-- IMPORTANT: Replace 'your-user-id' with your actual user ID
-- You can find your user ID in the user_profiles table or from Supabase Auth

-- Example: Update your phone number
-- UPDATE user_profiles 
-- SET phone_number = '+91XXXXXXXXXX'  -- Replace with your phone number
-- WHERE id = 'your-user-id';

SELECT '⚠️ IMPORTANT: Update your phone number in user_profiles!' AS reminder;
SELECT 'Run this query with YOUR phone number and user ID:' AS instruction;
SELECT 'UPDATE user_profiles SET phone_number = ''+91XXXXXXXXXX'' WHERE id = ''your-user-id'';' AS example;

-- ==================== STEP 6: Verification ====================
SELECT '' AS blank;
SELECT '🔍 VERIFICATION' AS section;
SELECT '' AS blank;

-- Check if SMS function exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ SMS alert function exists'
    ELSE '❌ SMS alert function missing'
  END as check_1
FROM information_schema.routines
WHERE routine_name = 'send_sms_alert'
  AND routine_schema = 'public';

-- Check if SMS trigger exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ SMS alert trigger exists'
    ELSE '❌ SMS alert trigger missing'
  END as check_2
FROM information_schema.triggers
WHERE trigger_name = 'on_alert_send_sms'
  AND trigger_schema = 'public';

-- Check if phone_number column exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Phone number column exists'
    ELSE '❌ Phone number column missing'
  END as check_3
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name = 'phone_number';

-- Show users with phone numbers configured
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' user(s) have phone numbers configured'
    ELSE '⚠️ No users have phone numbers configured yet'
  END as check_4
FROM user_profiles
WHERE phone_number IS NOT NULL
  AND receive_alerts = true;

SELECT '' AS blank;
SELECT '📱 SMS SETUP COMPLETE!' AS done;
SELECT '' AS blank;
SELECT 'Next steps:' AS next;
SELECT '1. Update your phone number in user_profiles' AS step_1;
SELECT '2. Test SMS alert by inserting a test alert' AS step_2;
SELECT '3. Check CircuitDigest dashboard for API calls' AS step_3;
SELECT '4. Verify SMS received on your phone' AS step_4;

-- ==================== TEST ALERT (Optional) ====================
-- Uncomment below to test SMS alert
-- This will create a test alert and trigger SMS

/*
INSERT INTO alerts (device_id, location, message, severity, temp, gas, flame)
VALUES (
  'ESP32_001',
  'Building A - Floor 1',
  'Test SMS alert from FireGuard',
  'high',
  35.5,
  450,
  1
);

-- Check CircuitDigest dashboard for the API call
-- Check your phone for the SMS message
*/

-- ==================== TROUBLESHOOTING ====================
-- If SMS is not working:
--
-- 1. Verify phone number is set:
--    SELECT id, email, phone_number, receive_alerts FROM user_profiles;
--
-- 2. Check CircuitDigest API key is correct:
--    The key should be: rOwEUEDsPAz7
--
-- 3. Verify phone number format:
--    Should be international format: +country-code-number
--    Example: +919876543210
--
-- 4. Check Supabase logs for errors:
--    Look for NOTICE messages from send_sms_alert function
--
-- 5. Test API manually:
--    SELECT net.http_post(
--      url := 'https://api.circuitdigest.com/sms/send',
--      headers := jsonb_build_object(
--        'Content-Type', 'application/json',
--        'Authorization', 'Bearer rOwEUEDsPAz7'
--      ),
--      body := jsonb_build_object(
--        'phone_number', '+919876543210',
--        'message', 'Test SMS from FireGuard'
--      )
--    );
