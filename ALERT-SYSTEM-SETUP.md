# FireGuard Alert System - Email & SMS Setup

**Status**: ⚠️ **NEEDS CONFIGURATION**  
**Current**: Email via Zapier (configured)  
**Planned**: SMS via CircuitDigest Cloud API (ready to implement)

---

## 📋 Current Alert Pipeline

```
ESP32 Device
    ↓
Supabase (sensor_data table)
    ↓
Threshold Monitor (checks thresholds)
    ↓
Alert Created (alerts table)
    ↓
Zapier Webhook Trigger (sends to Zapier)
    ↓
Zapier (formats data)
    ↓
Gmail (sends email)
```

---

## ✅ Email Alerts (Zapier) - Currently Working

### What's Configured
- ✅ Zapier webhook URL: `https://hooks.zapier.com/hooks/catch/25309342/us7itcy/`
- ✅ Trigger: Alert created in Supabase
- ✅ Action: Send formatted email via Gmail
- ✅ Includes: All sensor data, severity, location, timestamp

### Email Template Variables
```
- alert_id: UUID of the alert
- device_id: ESP32 device ID
- location: Physical location (default: "Building A - Floor 1")
- message: Alert message
- severity: Alert severity (critical, high, medium, low)
- temp: Temperature reading
- gas: Gas/smoke level
- humidity: Humidity percentage
- flame: Flame detection status
- time: Alert timestamp
- email: Recipient email address
```

### How to Test Email Alerts
```sql
-- Test by inserting a test alert
INSERT INTO alerts (device_id, location, message, severity, temp, gas, flame)
VALUES ('ESP32_001', 'Building A - Floor 1', 'Test alert', 'high', 35.5, 450, 1);

-- Check if email was sent in Zapier dashboard
-- Go to: https://zapier.com/app/dashboard
```

---

## 📱 SMS Alerts (CircuitDigest Cloud API) - READY TO IMPLEMENT

### Prerequisites
1. **CircuitDigest Cloud Account** - Create at https://circuitdigest.com
2. **API Key** - Get from CircuitDigest dashboard
3. **Phone Numbers** - Add to user_profiles table

### Implementation Steps

#### Step 1: Add Phone Number to user_profiles

```sql
-- Already added in FIX-DATABASE-FINAL.sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone_number text;

-- Update your profile with phone number
UPDATE user_profiles 
SET phone_number = '+91XXXXXXXXXX'  -- Your phone number
WHERE id = 'your-user-id';
```

#### Step 2: Create SMS Trigger Function

```sql
-- Create function to send SMS via CircuitDigest API
CREATE OR REPLACE FUNCTION send_sms_alert()
RETURNS TRIGGER AS $$
DECLARE
  circuitdigest_api_url TEXT := 'https://api.circuitdigest.com/sms/send';
  circuitdigest_api_key TEXT := 'YOUR_CIRCUITDIGEST_API_KEY';
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
    RAISE NOTICE 'No phone number found for SMS alert';
    RETURN NEW;
  END IF;
  
  -- Format SMS message
  sms_message := 'FireGuard Alert: ' || NEW.severity || ' - ' || NEW.message || 
                 ' [' || COALESCE(NEW.location, 'Building A - Floor 1') || ']';
  
  -- Send SMS via CircuitDigest API
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
      'severity', NEW.severity
    )
  ) INTO request_id;
  
  RAISE NOTICE 'Sent SMS alert to % for alert %', phone_number, NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Step 3: Create SMS Trigger

```sql
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_alert_send_sms ON alerts;

-- Create trigger that fires after each alert insert
CREATE TRIGGER on_alert_send_sms
  AFTER INSERT ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION send_sms_alert();
```

#### Step 4: Enable HTTP Extension (if not already enabled)

```sql
-- Check if HTTP extension is enabled
SELECT * FROM pg_extension WHERE extname = 'http';

-- If not enabled, enable it
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

---

## 🔧 Configuration Checklist

### Email (Zapier)
- [ ] Zapier account created
- [ ] Zap created with webhook trigger
- [ ] Gmail action configured
- [ ] Email template customized
- [ ] Test alert sent successfully
- [ ] Webhook URL verified in Supabase

### SMS (CircuitDigest)
- [ ] CircuitDigest Cloud account created
- [ ] API key obtained
- [ ] Phone numbers added to user_profiles
- [ ] SMS trigger function created
- [ ] SMS trigger enabled
- [ ] Test SMS sent successfully

---

## 🧪 Testing Alerts

### Test Email Alert
```sql
-- Insert test alert
INSERT INTO alerts (device_id, location, message, severity, temp, gas, flame)
VALUES ('ESP32_001', 'Building A - Floor 1', 'Test email alert', 'high', 35.5, 450, 1);

-- Check Zapier dashboard for webhook call
-- Check email inbox for received email
```

### Test SMS Alert (after SMS setup)
```sql
-- Insert test alert
INSERT INTO alerts (device_id, location, message, severity, temp, gas, flame)
VALUES ('ESP32_001', 'Building A - Floor 1', 'Test SMS alert', 'critical', 45.0, 600, 0);

-- Check CircuitDigest dashboard for API call
-- Check phone for received SMS
```

---

## 📊 Alert Severity Levels

| Severity | Condition | Email | SMS | Action |
|----------|-----------|-------|-----|--------|
| **critical** | Flame detected OR Gas > 600 OR Temp > 45°C | ✅ | ✅ | Immediate |
| **high** | Gas > 400 OR Temp > 35°C | ✅ | ✅ | Urgent |
| **medium** | Gas > 300 OR Temp > 25°C | ✅ | ❌ | Important |
| **low** | Minor threshold exceeded | ✅ | ❌ | Info |

---

## 🔐 Security Notes

### API Keys
- ✅ Store CircuitDigest API key in Supabase secrets (not in code)
- ✅ Use environment variables for sensitive data
- ✅ Never commit API keys to Git

### Phone Numbers
- ✅ Validate phone numbers before storing
- ✅ Use international format (+country-code)
- ✅ Encrypt phone numbers in database (optional)

### Rate Limiting
- ✅ Implement alert cooldown (default: 600 seconds)
- ✅ Prevent spam alerts
- ✅ Monitor API usage

---

## 🚨 Troubleshooting

### Email Not Received
1. Check Zapier dashboard for webhook calls
2. Verify webhook URL is correct
3. Check spam folder
4. Verify user has `receive_alerts = true`
5. Check Supabase logs for errors

### SMS Not Received
1. Verify CircuitDigest API key is correct
2. Check phone number format (+country-code)
3. Verify HTTP extension is enabled
4. Check CircuitDigest dashboard for API calls
5. Monitor Supabase logs for errors

### Alerts Not Created
1. Check threshold settings in device_settings
2. Verify sensor data is being received
3. Check alert cooldown period
4. Review threshold-monitor.ts logs
5. Verify device_id matches

---

## 📞 Support Resources

### Zapier
- Dashboard: https://zapier.com/app/dashboard
- Documentation: https://zapier.com/help
- Webhook Testing: https://webhook.site

### CircuitDigest Cloud
- Dashboard: https://circuitdigest.com/dashboard
- API Docs: https://api.circuitdigest.com/docs
- Support: support@circuitdigest.com

### Supabase
- Dashboard: https://app.supabase.com
- SQL Editor: For running queries
- Logs: Monitor for errors

---

## 📝 Next Steps

1. **Verify Email Alerts**
   - Test Zapier webhook
   - Send test alert
   - Verify email received

2. **Set Up SMS Alerts**
   - Get CircuitDigest API key
   - Add phone numbers to user_profiles
   - Create SMS trigger function
   - Test SMS alert

3. **Monitor & Optimize**
   - Check alert delivery rate
   - Monitor API usage
   - Adjust thresholds as needed
   - Review alert logs

---

**Last Updated**: November 15, 2024  
**Status**: Ready for Testing & SMS Implementation
