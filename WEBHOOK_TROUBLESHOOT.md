# 🔧 Webhook Troubleshooting - Email Not Received

## Problem
Alert inserted in Supabase but email not received in Gmail.

---

# Step 1: Check Supabase Webhook

## Verify Webhook Exists

1. **Go to:** Supabase Dashboard
2. **Click:** Database → Webhooks
3. **Look for:** "alert-to-zapier" webhook
4. **Verify:**
   - ✅ Webhook name: `alert-to-zapier`
   - ✅ Table: `alerts`
   - ✅ Event: INSERT (checked)
   - ✅ URL: Your Zapier webhook URL
   - ✅ Status: ENABLED (toggle ON)

---

## Check Webhook Logs

1. **In Webhooks list**
2. **Click on:** "alert-to-zapier"
3. **Look at:** Recent requests
4. **Should show:** POST requests to Zapier

---

# Step 2: Check Zapier Webhook

## Verify Zapier Received Data

1. **Go to:** Your Zapier Zap
2. **Click on:** "Webhooks by Zapier" trigger
3. **Look for:** "X requests received"
4. **Should show:** At least 1 request

---

## View Webhook Payload

1. **In Zapier trigger**
2. **Click:** "Test & Continue"
3. **Should show:** JSON data from Supabase
4. **Verify data includes:**
   - `device_id`
   - `message`
   - `severity`
   - `email`
   - `location`
   - `time`

---

# Step 3: Test the Complete Flow

## Insert Test Alert

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO alerts (device_id, message, severity, email, location, time)
VALUES (
  'ESP32_001',
  'Test Alert - Flame Detected',
  'critical',
  'ashivamone@gmail.com',
  'Building A - Floor 1',
  NOW()
);
```

**Then immediately check:**
1. Supabase webhook logs
2. Zapier webhook requests
3. Zapier task history

---

# Step 4: Debug Each Zapier Step

## Step 1: Webhook Trigger

**Check:**
- [ ] Webhook received data
- [ ] Data shows in test
- [ ] All fields present

**If failing:**
- Verify Supabase webhook URL is correct
- Verify webhook is enabled in Supabase
- Check Supabase webhook logs

---

## Step 2: Code by Zapier

**Check:**
- [ ] Code step exists
- [ ] JavaScript code is correct
- [ ] Test shows formatted output

**If failing:**
- Run "Test & Continue" on Code step
- Check for JavaScript errors
- Verify input data from Step 1

**Common errors:**
- `SyntaxError: Unexpected token` = HTML pasted in Code step
- `inputData is undefined` = Webhook not passing data

---

## Step 3: Gmail Action

**Check:**
- [ ] Gmail action exists
- [ ] To field: `{{step_2.email}}`
- [ ] Subject: `{{step_2.severity_emoji}} {{step_2.alert_type}}: {{step_2.severity}} - {{step_2.message}}`
- [ ] Body: HTML template pasted
- [ ] Body Type: HTML

**If failing:**
- Run "Test & Continue" on Gmail step
- Check Gmail inbox (spam folder too)
- Verify placeholders are correct

---

# Step 5: Manual Testing

## Test Zapier Webhook Directly

Use curl to send test data:

```powershell
$webhookUrl = "https://hooks.zapier.com/hooks/catch/25309342/uztemv4/"

$body = @{
    device_id = "ESP32_001"
    message = "🚨 CRITICAL: Flame detected in Building A - Floor 1"
    severity = "critical"
    email = "ashivamone@gmail.com"
    location = "Building A - Floor 1"
    time = (Get-Date -Format "o")
    temp = 65.2
    gas = 800
    humidity = 45.3
    flame = 0
} | ConvertTo-Json

Invoke-WebRequest -Uri $webhookUrl -Method POST -Body $body -ContentType "application/json"
```

**Then check:**
1. Zapier webhook received request
2. Code step processed it
3. Gmail sent email

---

# Common Issues & Fixes

## Issue 1: "No requests received" in Zapier

**Cause:** Supabase webhook not sending data

**Fix:**
1. Go to Supabase Webhooks
2. Verify webhook is ENABLED (toggle ON)
3. Verify URL is correct
4. Insert test alert again
5. Check webhook logs

---

## Issue 2: Webhook received but Code step fails

**Cause:** JavaScript error in Code step

**Fix:**
1. Go to Code step
2. Click "Test & Continue"
3. Check error message
4. Verify JavaScript is correct (no HTML)
5. Verify input is `step_1`

---

## Issue 3: Code step works but Gmail fails

**Cause:** Gmail configuration wrong

**Fix:**
1. Go to Gmail step
2. Verify To field: `{{step_2.email}}`
3. Verify Body Type: HTML
4. Verify HTML template is pasted
5. Click "Test & Continue"
6. Check Gmail inbox (and spam)

---

## Issue 4: Email received but looks broken

**Cause:** HTML template not rendering

**Fix:**
1. Check email in different email client
2. Verify HTML template is complete
3. Re-paste HTML template
4. Test again

---

# Diagnostic SQL

Run this to check alert data:

```sql
-- Check recent alerts
SELECT id, device_id, message, severity, email, location, time
FROM alerts
ORDER BY time DESC
LIMIT 5;

-- Check if email field is populated
SELECT COUNT(*) as total_alerts,
       COUNT(email) as alerts_with_email,
       COUNT(CASE WHEN email IS NULL THEN 1 END) as alerts_without_email
FROM alerts;

-- Check specific alert
SELECT * FROM alerts
WHERE device_id = 'ESP32_001'
ORDER BY time DESC
LIMIT 1;
```

---

# Verification Checklist

- [ ] Supabase webhook exists
- [ ] Webhook is ENABLED
- [ ] Webhook URL is correct
- [ ] Zapier webhook received requests
- [ ] Code step test passes
- [ ] Gmail step test passes
- [ ] Email received in Gmail
- [ ] Email looks professional
- [ ] All data is correct

---

# Quick Diagnostic Steps

1. **Insert test alert** in Supabase
2. **Check Supabase webhook logs** - should show POST request
3. **Check Zapier webhook** - should show "1 request received"
4. **Check Zapier Code step** - run test, should show formatted data
5. **Check Zapier Gmail step** - run test, should send email
6. **Check Gmail inbox** - should receive email

---

# If Still Not Working

**Provide:**
1. Supabase webhook URL (from Webhooks page)
2. Zapier webhook URL (from Catch Raw Hook trigger)
3. Error messages from any step
4. Screenshot of Zapier task history
5. Screenshot of Supabase webhook logs

---

# Status

🔴 **Email not received**
⏳ **Follow diagnostic steps above**
⏳ **Check each step**
⏳ **Verify configuration**

**Start with Step 1 and work through each step! 🚀**
