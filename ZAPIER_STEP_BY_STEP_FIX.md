# 🔧 Zapier Setup - Step by Step (FIXED)

## ⚠️ The Problem

You pasted the **HTML template into the Code step** instead of the **Gmail Body field**.

**Code step = JavaScript only** ❌
**Gmail Body field = HTML template** ✅

---

# CORRECT SETUP

## Step 1: Code by Zapier (JavaScript)

### Location
- **After:** Webhook trigger
- **Before:** Gmail action

### Input Data
```
Input: step_1
```

### Code (JavaScript ONLY)

Copy this JavaScript code:

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

// Format timestamp
const timestamp = alert.time 
  ? new Date(alert.time).toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  : new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
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
  timestamp: timestamp,
  dashboard_url: 'https://fireguard.thegdevelopers.online/dashboard',
  settings_url: 'https://fireguard.thegdevelopers.online/settings',
  company_url: 'https://thegdevelopers.info/',
  company_name: 'The GDevelopers',
  system_name: 'FireGuard: Fire Safety & Evacuation Alert System'
};
```

### Test
1. **Click:** "Test & Continue"
2. **Should show:** Formatted output (no errors)
3. **Click:** "Continue"

---

## Step 2: Gmail Action

### Location
- **After:** Code by Zapier step

### To Field
```
{{step_2.email}}
```

### From Name
```
FireGuard: Fire Safety & Evacuation Alert System
```

### Subject
```
{{step_2.severity_emoji}} {{step_2.alert_type}}: {{step_2.severity}} - {{step_2.message}}
```

### Body Type
```
HTML
```

### Body (HTML Template)

**IMPORTANT:** Paste the HTML template here, NOT in the Code step.

1. **Open:** `EMAIL_TEMPLATE_COPY_PASTE.html`
2. **Select All:** `Ctrl+A`
3. **Copy:** `Ctrl+C`
4. **Click in Gmail Body field**
5. **Paste:** `Ctrl+V`

The HTML should appear in the Body field.

### Test
1. **Click:** "Test & Continue"
2. **Check Gmail inbox**
3. **Verify email looks professional**

---

# ✅ Correct Flow

```
┌──────────────────────────────────┐
│  Step 1: Webhook Trigger         │
│  Receives JSON from Supabase     │
└──────────────────┬───────────────┘
                   │
                   ↓
┌──────────────────────────────────┐
│  Step 2: Code by Zapier          │
│  JavaScript code (NOT HTML)      │
│  Formats data                    │
│  Returns formatted object        │
└──────────────────┬───────────────┘
                   │
                   ↓
┌──────────────────────────────────┐
│  Step 3: Gmail Action            │
│  HTML template in Body field     │
│  Uses {{step_2.*}} placeholders  │
│  Sends professional email        │
└──────────────────────────────────┘
```

---

# ❌ What NOT to Do

### ❌ Don't paste HTML in Code step
- Code step = JavaScript only
- HTML will cause syntax error

### ❌ Don't paste JavaScript in Gmail Body
- Gmail Body = HTML only
- JavaScript won't render

### ❌ Don't mix them up
- Each step has its own purpose
- Follow the flow above

---

# 🔍 Troubleshooting

### Error: "SyntaxError: Unexpected token '<'"

**Cause:** HTML pasted in Code step
**Fix:** 
1. Go to Code step
2. Delete the HTML
3. Paste only the JavaScript code
4. Test again

### Error: "Body field is empty"

**Cause:** HTML not pasted in Gmail Body
**Fix:**
1. Go to Gmail action
2. Click in Body field
3. Paste the HTML template
4. Test again

### Error: "Placeholders not working"

**Cause:** Using wrong step number
**Fix:**
1. Verify Code step is "step_2"
2. Use `{{step_2.field}}` format
3. Check field names match Code output

---

# 📋 Checklist

**Code by Zapier Step:**
- [ ] JavaScript code pasted (NOT HTML)
- [ ] Input set to "step_1"
- [ ] Test shows formatted output
- [ ] No syntax errors

**Gmail Action:**
- [ ] To field: `{{step_2.email}}`
- [ ] From Name: "FireGuard: Fire Safety & Evacuation Alert System"
- [ ] Subject: `{{step_2.severity_emoji}} {{step_2.alert_type}}: {{step_2.severity}} - {{step_2.message}}`
- [ ] Body Type: HTML
- [ ] Body: HTML template pasted (NOT JavaScript)
- [ ] Test shows professional email
- [ ] The GDevelopers branding visible

---

# 🚀 Next Steps

1. **Fix Code step** - Remove HTML, keep JavaScript only
2. **Fix Gmail Body** - Paste HTML template
3. **Test both steps**
4. **Publish Zap**

---

# 📧 Expected Result

**Email Subject:**
```
🚨 Alert: CRITICAL - Flame detected in Building A - Floor 1
```

**Email Body:**
- Professional design with gradients
- Red header with system name
- Alert type badge
- Message box
- Device details grid
- Action buttons
- The GDevelopers footer

**Status:** ✅ Ready to deploy!
