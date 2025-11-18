-- FireGuard SMS Alerts via CircuitDigest Cloud API - SIMPLE VERSION
-- This script sets up SMS alerts triggered directly from Supabase
-- Run this in Supabase SQL Editor

-- ==================== STEP 1: Enable HTTP Extension ====================
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

SELECT '✅ HTTP extension enabled' AS status;

-- ==================== STEP 2: Add Phone Number Column ====================
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone_number text;

SELECT '✅ Phone number column ready' AS status;

-- ==================== STEP 3: Create SMS Alert Function ====================
CREATE OR REPLACE FUNCTION send_sms_alert()
RETURNS TRIGGER AS $$
DECLARE
  circuitdigest_api_url TEXT := 'https://api.circuitdigest.com/sms/send';
  circuitdigest_api_key TEXT := 'rOwEUEDsPAz7';
  request_id BIGINT;
  phone_number TEXT;
  sms_message TEXT;
BEGIN
  -- Get phone number from user_profiles
  SELECT phone_number INTO phone_number
  FROM user_profiles
  WHERE receive_alerts = true
  LIMIT 1;
  
  -- If no phone number, skip SMS
  IF phone_number IS NULL THEN
    RAISE NOTICE 'No phone number found for SMS alert %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Format SMS message
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
DROP TRIGGER IF EXISTS on_alert_send_sms ON alerts;

CREATE TRIGGER on_alert_send_sms
  AFTER INSERT ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION send_sms_alert();

SELECT '✅ SMS alert trigger created' AS status;

-- ==================== STEP 5: Verification ====================
SELECT '' AS blank;
SELECT '🔍 VERIFICATION' AS section;

-- Check SMS function
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ SMS alert function exists'
    ELSE '❌ SMS alert function missing'
  END as check_1
FROM information_schema.routines
WHERE routine_name = 'send_sms_alert'
  AND routine_schema = 'public';

-- Check SMS trigger
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ SMS alert trigger exists'
    ELSE '❌ SMS alert trigger missing'
  END as check_2
FROM information_schema.triggers
WHERE trigger_name = 'on_alert_send_sms'
  AND trigger_schema = 'public';

-- Check phone_number column
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Phone number column exists'
    ELSE '❌ Phone number column missing'
  END as check_3
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name = 'phone_number';

SELECT '' AS blank;
SELECT '📱 SMS SETUP COMPLETE!' AS done;
SELECT '' AS blank;
SELECT 'Next: Add your phone number to user_profiles' AS next_step;

-- ==================== SHOW YOUR USER ID ====================
SELECT '' AS blank;
SELECT 'Your User Profiles:' AS info;
SELECT id, email, full_name, receive_alerts FROM user_profiles;

SELECT '' AS blank;
SELECT 'Copy your user ID and run this to add your phone number:' AS instruction;
SELECT 'UPDATE user_profiles SET phone_number = ''+917390973582'' WHERE id = ''9f95f8fa-5b21-495a-806c-06715d26cb0a'';' AS example;
