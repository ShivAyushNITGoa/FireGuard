# ⏰ Fix: Update Zapier Code Step - Use Actual Alert Time

## Problem
Email shows current time (when email is sent) instead of actual alert time (when alert was created).

## Solution
Replace the Code by Zapier step with the fixed version that uses `alert.time` from the webhook.

---

# Step 1: Open Zapier Code Step

1. **Go to:** Your Zapier Zap
2. **Click on:** "Code by Zapier" step
3. **Click:** Edit

---

# Step 2: Replace Code

### Delete Old Code

Select all the JavaScript code and delete it.

### Paste New Code

Copy the entire code from `ZAPIER_CODE_STEP_FIXED.js`:

```javascript
// Get alert data from webhook
const alert = inputData;

// Determine if it's an alert or warning
const severity = (alert.severity || 'low').toLowerCase();
const isAlert = ['critical', 'high'].includes(severity);
const isWarning = ['medium', 'low'].includes(severity);

// Severity emoji and color mapping
const severityMap = {
  'critical': { emoji: '🚨', color: '#DC2626', type: 'Alert' },
  'high': { emoji: '⚠️', color: '#EA580C', type: 'Alert' },
  'medium': { emoji: '⚡', color: '#F59E0B', type: 'Warning' },
  'low': { emoji: 'ℹ️', color: '#10B981', type: 'Warning' }
};

const { emoji, color, type } = severityMap[severity] || { emoji: '🔔', color: '#6B7280', type: 'Alert' };

// Format timestamp - USE ALERT TIME, NOT CURRENT TIME
const timestamp = alert.time 
  ? new Date(alert.time).toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'  // IST timezone
    })
  : new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });

// Return formatted data
return {
  alert_type: type,
  severity: severity.toUpperCase(),
  severity_emoji: emoji,
  severity_color: color,
  message: alert.message || 'Alert triggered',
  device_id: alert.device_id || 'Unknown Device',
  location: alert.location || 'Building A - Floor 1',
  email: alert.email || 'admin@fireguard.com',
  timestamp: timestamp,  // ACTUAL alert time, not current time
  dashboard_url: 'https://fireguard.thegdevelopers.online/dashboard',
  settings_url: 'https://fireguard.thegdevelopers.online/settings',
  company_url: 'https://thegdevelopers.info/',
  company_name: 'The GDevelopers',
  system_name: 'FireGuard: Fire Safety & Evacuation Alert System'
};
```

---

# Step 3: Key Changes

## What Changed

### Before (Wrong)
```javascript
const timestamp = alert.time 
  ? new Date(alert.time).toLocaleString(...)
  : new Date().toLocaleString(...);  // ❌ Uses current time
```

### After (Fixed)
```javascript
const timestamp = alert.time 
  ? new Date(alert.time).toLocaleString(..., { timeZone: 'Asia/Kolkata' })
  : new Date().toLocaleString(..., { timeZone: 'Asia/Kolkata' });  // ✅ Uses alert time
```

## What This Does

- ✅ Uses `alert.time` from webhook (actual alert creation time)
- ✅ Formats in IST timezone (Asia/Kolkata)
- ✅ Shows correct time in email
- ✅ No more "constant/default" time

---

# Step 4: Test

1. **Click:** "Test & Continue"
2. **Should show:** Formatted output with correct timestamp
3. **Click:** "Continue"

---

# Step 5: Verify in Email

1. **Insert test alert:**

```sql
INSERT INTO alerts (device_id, message, severity, email, location, time)
VALUES (
  'ESP32_001',
  'Test Alert - Check Timestamp',
  'critical',
  'ashivamone@gmail.com',
  'Building A - Floor 1',
  NOW()
);
```

2. **Check email:**
   - Should show alert creation time
   - Should NOT show current time
   - Should be in IST timezone

---

# Example Output

### Before (Wrong)
```
Time: Nov 19, 2025 10:48:32 PM  ❌ (current time when email sent)
```

### After (Fixed)
```
Time: Nov 19, 2025 9:30:15 PM   ✅ (actual alert creation time)
```

---

# Checklist

- [ ] Opened Code by Zapier step
- [ ] Deleted old code
- [ ] Pasted new code
- [ ] Tested code step
- [ ] Inserted test alert
- [ ] Received email
- [ ] Timestamp is correct (alert time, not current time)
- [ ] Timezone is IST

---

# Status

✅ **Fixed timestamp logic**
✅ **Uses actual alert time**
✅ **IST timezone applied**
⏳ **Update Zapier Code step**
⏳ **Test with new alert**

**Update your Zapier Code step now! 🚀**
