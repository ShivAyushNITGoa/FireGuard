# ✅ Fix: Webhook Not Triggering (Email Not Received)

## Status: Data is Good ✅

```
✅ 128 alerts have email addresses
✅ Email field is populated
✅ Data is correct in database
```

**Problem:** Webhook not sending data to Zapier

---

# Root Cause Analysis

Your alerts exist with emails, but Zapier isn't receiving them. This means:

1. ❌ Supabase webhook not created
2. ❌ Supabase webhook disabled
3. ❌ Zapier webhook URL incorrect
4. ❌ Webhook not firing on INSERT

---

# Fix: Create/Verify Supabase Webhook

## Step 1: Go to Supabase

1. **Open:** https://supabase.com
2. **Sign in** to your project
3. **Select:** Your FireGuard project

---

## Step 2: Create Webhook

### Navigate to Webhooks

1. **Left sidebar:** Click "Database"
2. **Click:** "Webhooks"
3. **Click:** "Create a new webhook"

---

### Configure Webhook

**Webhook Name:**
```
alert-to-zapier
```

**Table:**
```
alerts
```

**Events:**
- ✅ INSERT (checked)
- ❌ UPDATE (unchecked)
- ❌ DELETE (unchecked)

**HTTP Request:**

**Method:** POST

**URL:** Your Zapier webhook URL

```
https://hooks.zapier.com/hooks/catch/25309342/uztemv4/
```

---

## Step 3: Create Webhook

1. **Click:** "Create webhook"
2. **Should show:** "Webhook created successfully"
3. **Status:** ENABLED ✅

---

# Step 4: Test Webhook

## Insert New Alert

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO alerts (device_id, message, severity, email, location, time)
VALUES (
  'ESP32_TEST',
  '🚨 TEST: Webhook Test Alert',
  'critical',
  'ashivamone@gmail.com',
  'Building A - Floor 1',
  NOW()
);
```

---

## Check Supabase Webhook Logs

1. **Go to:** Database → Webhooks
2. **Click on:** "alert-to-zapier"
3. **Look at:** Recent requests
4. **Should show:** POST request to Zapier URL

---

## Check Zapier Webhook

1. **Go to:** Your Zapier Zap
2. **Click on:** "Webhooks by Zapier" trigger
3. **Should show:** "1 request received"
4. **Click:** "Test & Continue"
5. **Should show:** Alert data

---

# If Webhook Still Not Working

## Verify Webhook URL

1. **In Supabase Webhooks page**
2. **Click on:** "alert-to-zapier"
3. **Copy the URL** from the webhook config
4. **Compare with** your Zapier webhook URL

**They must match exactly!**

---

## Check Webhook is Enabled

1. **In Supabase Webhooks page**
2. **Look for:** Toggle switch next to webhook
3. **Should be:** ON (enabled)
4. **If OFF:** Click to enable

---

## Verify INSERT Event Selected

1. **In Supabase Webhooks page**
2. **Click on:** "alert-to-zapier"
3. **Check:** Events section
4. **Should have:** ✅ INSERT checked

---

# Complete Verification

Run this SQL to verify webhook is working:

```sql
-- Insert test alert
INSERT INTO alerts (device_id, message, severity, email, location, time)
VALUES (
  'ESP32_WEBHOOK_TEST',
  'Webhook Test - ' || NOW()::text,
  'high',
  'ashivamone@gmail.com',
  'Building A - Floor 1',
  NOW()
);

-- Check if alert was inserted
SELECT id, device_id, message, severity, email, time
FROM alerts
WHERE device_id = 'ESP32_WEBHOOK_TEST'
ORDER BY time DESC
LIMIT 1;
```

---

# Troubleshooting Checklist

- [ ] Supabase webhook created
- [ ] Webhook name: "alert-to-zapier"
- [ ] Table: "alerts"
- [ ] Event: INSERT (checked)
- [ ] URL: Zapier webhook URL
- [ ] Webhook ENABLED (toggle ON)
- [ ] Test alert inserted
- [ ] Supabase webhook logs show POST
- [ ] Zapier webhook shows "1 request received"
- [ ] Zapier Code step test passes
- [ ] Zapier Gmail step test passes
- [ ] Email received in Gmail

---

# Expected Flow After Fix

```
1. Insert Alert in Supabase
   ↓
2. Supabase Webhook Triggers (INSERT event)
   ↓
3. POST to Zapier Webhook URL
   ↓
4. Zapier Receives Data
   ↓
5. Zapier Code Step Formats Data
   ↓
6. Zapier Gmail Sends Email
   ↓
7. Email Received ✅
```

---

# Status

✅ **Data is correct** (128 alerts with email)
⏳ **Create/verify Supabase webhook**
⏳ **Test webhook**
⏳ **Receive email**

**Follow the steps above to fix! 🚀**

---

# Quick Summary

**Your problem:** Webhook not created or not enabled

**Your solution:**
1. Go to Supabase Webhooks
2. Create webhook "alert-to-zapier"
3. Set to alerts table, INSERT event
4. Paste Zapier webhook URL
5. Enable webhook
6. Test with new alert
7. Check Zapier receives data
8. Email should arrive

**That's it! 🎉**
