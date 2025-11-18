-- Zapier Webhook Integration for FireGuard Email Alerts
-- This trigger sends all sensor data to your Zapier webhook when an alert is created

-- ==================== CONFIGURATION ====================
-- Replace 'YOUR_ZAPIER_WEBHOOK_URL' with your actual Zapier webhook URL
-- Example: https://hooks.zapier.com/hooks/catch/12345678/abcdefg/

-- ==================== FUNCTION ====================
CREATE OR REPLACE FUNCTION send_to_zapier_webhook()
RETURNS TRIGGER AS $$
DECLARE
  zapier_webhook_url TEXT := 'https://hooks.zapier.com/hooks/catch/25309342/us7itcy/';
  request_id BIGINT;
  user_email TEXT;
  sensor_humidity NUMERIC;
BEGIN
  -- Get user email from user_profiles (you can customize this query)
  SELECT email INTO user_email
  FROM user_profiles
  WHERE receive_alerts = true
  LIMIT 1;
  
  -- If no user email found, use a default or skip
  IF user_email IS NULL THEN
    user_email := 'admin@fireguard.com';
  END IF;
  
  -- Get latest humidity reading from sensor_data
  SELECT humidity INTO sensor_humidity
  FROM sensor_data
  WHERE device_id = NEW.device_id
  ORDER BY time DESC
  LIMIT 1;
  
  -- Send data to Zapier webhook with all sensor information
  SELECT net.http_post(
    url := zapier_webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'alert_id', NEW.id::text,
      'device_id', NEW.device_id,
      'location', NEW.location,
      'message', NEW.message,
      'severity', NEW.severity,
      'temp', NEW.temp,
      'gas', NEW.gas,
      'humidity', COALESCE(sensor_humidity, 0),
      'flame', NEW.flame,
      'time', COALESCE(NEW.time, NOW())::text,
      'email', user_email
    )
  ) INTO request_id;
  
  -- Log the webhook call (optional)
  RAISE NOTICE 'Sent alert % to Zapier webhook. Request ID: %', NEW.id, request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGER ====================
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_alert_send_to_zapier ON alerts;

-- Create trigger that fires after each alert insert
CREATE TRIGGER on_alert_send_to_zapier
  AFTER INSERT ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION send_to_zapier_webhook();

-- ==================== VERIFICATION ====================
SELECT '✅ Zapier webhook trigger created successfully!' AS status;

-- Test the trigger by inserting a test alert (optional - comment out if not needed)
-- INSERT INTO alerts (device_id, location, message, severity, temp, gas, flame)
-- VALUES ('ESP32_001', 'Building A - Floor 1', 'Test alert', 'medium', 35.5, 450, 1);

-- ==================== NOTES ====================
-- 1. Make sure the HTTP extension is enabled:
--    CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
--
-- 2. Replace 'YOUR_ZAPIER_WEBHOOK_URL' with your actual webhook URL
--
-- 3. The function sends these fields to Zapier:
--    - alert_id: UUID of the alert
--    - device_id: ESP32 device identifier
--    - location: Physical location of the device
--    - message: Alert message
--    - severity: Alert severity (critical, high, medium, low)
--    - temp: Temperature in Celsius
--    - gas: Gas/smoke reading (AQI)
--    - humidity: Humidity percentage
--    - flame: Flame detection (0 = detected, 1 = clear)
--    - time: Timestamp of the alert
--    - email: User email to send alert to
--
-- 4. Customize the user email query based on your needs:
--    - Send to all subscribed users
--    - Send to specific users based on device
--    - Send to admin only
--
-- 5. Monitor webhook calls in Supabase logs:
--    SELECT * FROM pg_stat_statements WHERE query LIKE '%http_post%';

-- ==================== ADVANCED: SEND TO MULTIPLE USERS ====================
-- If you want to send to multiple users, use this version instead:

/*
CREATE OR REPLACE FUNCTION send_to_zapier_webhook_multi()
RETURNS TRIGGER AS $$
DECLARE
  zapier_webhook_url TEXT := 'YOUR_ZAPIER_WEBHOOK_URL';
  request_id BIGINT;
  user_record RECORD;
  sensor_humidity NUMERIC;
  severity_priority INTEGER;
BEGIN
  -- Map severity to priority
  severity_priority := CASE NEW.severity
    WHEN 'critical' THEN 4
    WHEN 'high' THEN 3
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 1
    ELSE 0
  END;
  
  -- Get latest humidity reading
  SELECT humidity INTO sensor_humidity
  FROM sensor_data
  WHERE device_id = NEW.device_id
  ORDER BY time DESC
  LIMIT 1;
  
  -- Loop through subscribed users
  FOR user_record IN
    SELECT 
      up.email,
      up.alert_email,
      asub.min_severity
    FROM alert_subscriptions asub
    JOIN user_profiles up ON asub.user_id = up.id
    WHERE asub.device_id = NEW.device_id
      AND asub.email_enabled = true
      AND up.receive_alerts = true
      AND severity_priority >= CASE asub.min_severity
        WHEN 'critical' THEN 4
        WHEN 'high' THEN 3
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 1
        ELSE 0
      END
  LOOP
    -- Send to Zapier for each user
    SELECT net.http_post(
      url := zapier_webhook_url,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'alert_id', NEW.id::text,
        'device_id', NEW.device_id,
        'location', NEW.location,
        'message', NEW.message,
        'severity', NEW.severity,
        'temp', NEW.temp,
        'gas', NEW.gas,
        'humidity', COALESCE(sensor_humidity, 0),
        'flame', NEW.flame,
        'time', COALESCE(NEW.time, NOW())::text,
        'email', COALESCE(user_record.alert_email, user_record.email)
      )
    ) INTO request_id;
    
    RAISE NOTICE 'Sent alert % to % via Zapier', NEW.id, user_record.email;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Use this trigger for multi-user support
DROP TRIGGER IF EXISTS on_alert_send_to_zapier_multi ON alerts;
CREATE TRIGGER on_alert_send_to_zapier_multi
  AFTER INSERT ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION send_to_zapier_webhook_multi();
*/

-- ==================== TROUBLESHOOTING ====================
-- If webhook is not working:
--
-- 1. Check if HTTP extension is enabled:
--    SELECT * FROM pg_extension WHERE extname = 'http';
--
-- 2. Test webhook URL manually:
--    SELECT net.http_post(
--      url := 'YOUR_ZAPIER_WEBHOOK_URL',
--      headers := '{"Content-Type": "application/json"}',
--      body := '{"test": "data"}'
--    );
--
-- 3. Check Supabase logs for errors
--
-- 4. Verify webhook URL is correct in Zapier dashboard
--
-- 5. Test with a simple alert insert:
--    INSERT INTO alerts (device_id, message, severity)
--    VALUES ('ESP32_001', 'Test', 'low');
