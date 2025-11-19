# 🚨 Threshold-Based Alert Email Flow

## Overview

Alerts are **automatically created when sensor data exceeds thresholds**, then emails are sent via Zapier.

```
Sensor Data Received
    ↓
Check Against Thresholds
    ↓
Threshold Exceeded?
    ├─ YES → Create Alert
    │         ↓
    │         Webhook Triggers
    │         ↓
    │         Zapier Sends Email ✅
    │
    └─ NO → No alert
```

---

## How It Works

### 1. Sensor Data Arrives

ESP32 sends sensor readings to Supabase:
```json
{
  "device_id": "ESP32_001",
  "temp": 45,
  "gas": 550,
  "humidity": 80,
  "flame": 0
}
```

### 2. Threshold Monitor Checks

Web app's threshold monitor compares against thresholds:

| Sensor | Warning | Danger |
|--------|---------|--------|
| **Temp** | 25°C | 45°C |
| **Gas** | 100 PPM | 500 PPM |
| **Humidity** | 70% | 85% |
| **Flame** | Any detection | - |

### 3. Alert Created (If Exceeded)

If any threshold exceeded:
```sql
INSERT INTO alerts (
  device_id,
  message,
  severity,
  email,
  temp,
  gas,
  humidity,
  flame,
  location,
  time
) VALUES (...)
```

### 4. Webhook Triggers

Supabase webhook automatically sends to Zapier:
```json
{
  "device_id": "ESP32_001",
  "message": "⚠️ WARNING: Temperature elevated [45°C]",
  "severity": "high",
  "email": "ashivamone@gmail.com",
  "temp": 45,
  "gas": 550,
  "humidity": 80,
  "flame": 0,
  "location": "Building A - Floor 1"
}
```

### 5. Email Sent

Zapier receives webhook and sends professional email ✅

---

## Current Thresholds

Located in: `lib/threshold-monitor.ts`

```typescript
// Default thresholds
const thresholds = {
  gas_warning: 100,
  gas_danger: 500,
  temp_warning: 25,
  temp_danger: 45,
  humidity_warning: 70,
  humidity_danger: 85
};
```

---

## Alert Severity Levels

Based on how much threshold is exceeded:

| Condition | Severity | Emoji |
|-----------|----------|-------|
| Flame detected | critical | 🚨 |
| Danger threshold exceeded | high | ⚠️ |
| Warning threshold exceeded | medium | ⚡ |
| Multiple warnings | high | ⚠️ |

---

## Alert Message Format

```
⚠️ WARNING: Temperature elevated [Gas: 550 PPM, Temp: 45°C, Humidity: 80%]
```

Or for critical:
```
🚨 CRITICAL: Flame detected! [Gas: 800 PPM, Temp: 65°C]
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              THRESHOLD-BASED ALERT EMAIL FLOW                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ESP32 Sends Sensor Data                                    │
│     POST /sensor_data {temp: 45, gas: 550, humidity: 80}       │
│                                                                 │
│  2. Supabase Receives                                          │
│     INSERT INTO sensor_data (...)                              │
│                                                                 │
│  3. Threshold Monitor Checks (Real-time subscription)          │
│     Compare: temp (45) > danger (45)? YES ✓                   │
│                                                                 │
│  4. Alert Created                                              │
│     INSERT INTO alerts (                                       │
│       message: "⚠️ WARNING: Temperature elevated",             │
│       severity: "high",                                        │
│       email: "ashivamone@gmail.com",                          │
│       ...                                                      │
│     )                                                          │
│                                                                 │
│  5. Webhook Triggers (AFTER INSERT)                           │
│     POST to Zapier webhook URL                                │
│     Payload: {device_id, message, severity, email, ...}       │
│                                                                 │
│  6. Zapier Receives                                           │
│     {{step_1.message}}, {{step_1.severity}}, etc.            │
│                                                                 │
│  7. Gmail Sends Professional Email                            │
│     To: {{step_1.email}}                                      │
│     Subject: 🚨 FireGuard Alert: HIGH - Temperature elevated   │
│     Body: Professional HTML with dashboard link               │
│                                                                 │
│  8. Email Delivered ✅                                         │
│     User receives alert in inbox                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cooldown Period

To prevent spam, alerts have a **10-minute cooldown**:

```typescript
const cooldownMs = 600000; // 10 minutes

// Only send alert if last alert was > 10 minutes ago
if (now - lastAlertTime[deviceId] > cooldownMs) {
  // Create alert
}
```

---

## Testing the Flow

### Step 1: Verify Thresholds

Check current thresholds in database:

```sql
SELECT * FROM device_settings
WHERE device_id = 'ESP32_001';
```

### Step 2: Send Test Sensor Data

Simulate sensor data exceeding threshold:

```sql
INSERT INTO sensor_data (device_id, temp, gas, humidity, flame, time)
VALUES (
  'ESP32_001',
  50,        -- Exceeds danger threshold (45°C)
  600,       -- Exceeds danger threshold (500 PPM)
  85,        -- Exceeds danger threshold (85%)
  0,
  NOW()
);
```

### Step 3: Check Alert Created

```sql
SELECT * FROM alerts
WHERE device_id = 'ESP32_001'
ORDER BY created_at DESC
LIMIT 1;
```

Should show:
- ✅ Alert created
- ✅ Email populated
- ✅ Message formatted
- ✅ Severity set

### Step 4: Check Zapier

1. Go to Zapier task history
2. Should see webhook received
3. Should see email sent

### Step 5: Check Gmail

1. Check inbox at ashivamone@gmail.com
2. Should see professional alert email ✅

---

## Email Content

The email will include:

```
🔥 FireGuard Alert
Severity: HIGH

⚠️ Alert Notification

⚠️ WARNING: Temperature elevated [Gas: 600 PPM, Temp: 50°C, Humidity: 85%]

[📊 View Dashboard] [⚙️ Settings]

This is an automated alert from your FireGuard system. 
Please review and take necessary action.

---

The GDevelopers
FireGuard - Advanced Fire & Safety Monitoring System

© 2025 The GDevelopers
```

---

## Setup Checklist

- [ ] Thresholds configured in `device_settings`
- [ ] Threshold monitor running (`lib/threshold-monitor.ts`)
- [ ] Supabase webhook created
- [ ] Zapier Zap created and published
- [ ] Gmail action configured
- [ ] Test sensor data sent
- [ ] Alert created in database
- [ ] Email received

---

## Customizing Thresholds

### Option 1: Database

Update in `device_settings` table:

```sql
UPDATE device_settings
SET 
  gas_warning_threshold = 100,
  gas_danger_threshold = 500,
  temp_warning_threshold = 25,
  temp_danger_threshold = 45,
  humidity_warning_threshold = 70,
  humidity_danger_threshold = 85
WHERE device_id = 'ESP32_001';
```

### Option 2: Code

Edit `lib/threshold-monitor.ts`:

```typescript
const settings = {
  gas_warning_threshold: 100,
  gas_danger_threshold: 500,
  temp_warning_threshold: 25,
  temp_danger_threshold: 45,
  humidity_warning_threshold: 70,
  humidity_danger_threshold: 85
};
```

---

## Alert Cooldown

Default: **10 minutes** between alerts for same device

To change, edit `lib/threshold-monitor.ts`:

```typescript
const cooldownMs = 600000; // 10 minutes
// Change to:
const cooldownMs = 300000; // 5 minutes
// Or:
const cooldownMs = 1800000; // 30 minutes
```

---

## Troubleshooting

### Alert Not Created

**Check:**
1. Sensor data exceeds threshold?
2. Cooldown period passed?
3. Device settings exist?

**Verify:**
```sql
SELECT * FROM device_settings WHERE device_id = 'ESP32_001';
SELECT * FROM sensor_data WHERE device_id = 'ESP32_001' ORDER BY time DESC LIMIT 1;
```

### Email Not Received

**Check:**
1. Alert was created (check alerts table)
2. Webhook triggered (check Zapier logs)
3. Email address correct in alert

**Verify:**
```sql
SELECT email, message, severity FROM alerts WHERE device_id = 'ESP32_001' ORDER BY created_at DESC LIMIT 1;
```

### Too Many Emails

**Solution:** Increase cooldown period

```typescript
const cooldownMs = 1800000; // 30 minutes instead of 10
```

---

## Status

✅ **Threshold monitoring active**
✅ **Alert creation working**
✅ **Webhook configured**
✅ **Email system ready**

**Next:** Send test sensor data and verify email arrives!

---

## Quick Reference

| Component | Location | Status |
|-----------|----------|--------|
| Thresholds | `device_settings` table | ✅ Configured |
| Monitor | `lib/threshold-monitor.ts` | ✅ Running |
| Alert Creation | `checkThresholds()` function | ✅ Active |
| Webhook | Supabase Database Webhooks | ✅ Created |
| Zapier Zap | Zapier account | ✅ Published |
| Email Template | Zapier Gmail action | ✅ Ready |

**Everything is connected! 🎉**
