# 🚀 Complete Setup Guide: Zero to Email Alerts

## Overview

Complete step-by-step guide to set up the alert email system:

```
Supabase Alert Created
    ↓
Webhook sends to Zapier
    ↓
Code by Zapier formats data
    ├─ Alert → "🚨 Alert" title
    ├─ Warning → "⚠️ Warning" title
    ├─ No sensor data
    ├─ Add dashboard, settings URLs
    ├─ The GDevelopers branding
    └─ Professional formatting
    ↓
Gmail sends formatted email ✅
```

---

# PART 1: CREATE ZAPIER ZAP (From Zero)

## Step 1: Go to Zapier

1. **Open:** https://zapier.com
2. **Sign in** (or create account)
3. **Click:** "Create" → "New Zap"

---

## Step 2: Add Webhook Trigger

### Search for Webhook

1. **In "Choose a trigger app"** search box, type: `Webhooks by Zapier`
2. **Click:** "Webhooks by Zapier"

### Select Trigger

1. **Choose event:** "Catch Raw Hook"
2. **Click:** "Continue"

### Get Webhook URL

1. **You'll see a webhook URL** (looks like: `https://hooks.zapier.com/hooks/catch/...`)
2. **COPY THIS URL** - You'll need it for Supabase
3. **Click:** "Continue"

---

## Step 3: Add Code by Zapier Step

### Add Action

1. **Click:** "+" to add action
2. **Search:** "Code by Zapier"
3. **Click:** "Code by Zapier"
4. **Click:** "Continue"

### Configure Code Step

**Input Data:**
- **Input:** `step_1` (from webhook)

**Code (JavaScript):**

Copy this entire code:

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
  // Alert type (Alert or Warning)
  alert_type: type,
  
  // Severity info
  severity: severity.toUpperCase(),
  severity_emoji: emoji,
  severity_color: color,
  
  // Alert details
  message: alert.message || 'Alert triggered',
  device_id: alert.device_id || 'Unknown Device',
  location: alert.location || 'Building A - Floor 1',
  email: alert.email || 'admin@fireguard.com',
  
  // Timestamp
  timestamp: timestamp,
  
  // URLs
  dashboard_url: 'https://fireguard.thegdevelopers.online/dashboard',
  settings_url: 'https://fireguard.thegdevelopers.online/settings',
  company_url: 'https://thegdevelopers.info/',
  company_name: 'The GDevelopers',
  system_name: 'FireGuard: Fire Safety & Evacuation Alert System'
};
```

### Test Code Step

1. **Click:** "Test & Continue"
2. **Should show:** Formatted output
3. **Click:** "Continue"

---

## Step 4: Add Gmail Action

### Search Gmail

1. **Click:** "+" to add action
2. **Search:** "Gmail"
3. **Select:** "Send Email"
4. **Click:** "Continue"

### Sign in to Gmail

1. **Click:** "Sign in to Gmail"
2. **Select your Gmail account**
3. **Allow Zapier access**

---

## Step 5: Configure Gmail Fields

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

**Example subjects:**
- `🚨 Alert: CRITICAL - Flame detected in Building A`
- `⚠️ Warning: MEDIUM - Temperature elevated`

### Body Type
```
HTML
```

### Body (HTML)

Copy this complete professional HTML template with The GDevelopers branding:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      line-height: 1.6;
      color: #333;
    }
    .wrapper {
      padding: 20px;
    }
    .container { 
      max-width: 650px; 
      margin: 0 auto;
      background: white; 
      border-radius: 16px; 
      overflow: hidden; 
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    }
    .header { 
      background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); 
      color: white; 
      padding: 50px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -5%;
      width: 200px;
      height: 200px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
    }
    .header-content {
      position: relative;
      z-index: 1;
    }
    .header h1 { 
      font-size: 36px; 
      margin-bottom: 8px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p { 
      font-size: 15px; 
      opacity: 0.95;
      font-weight: 500;
    }
    .content { 
      padding: 45px 35px;
    }
    .alert-type-badge {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 25px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .alert-type-badge.alert {
      background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
      color: #991B1B;
      border: 2px solid #DC2626;
    }
    .alert-type-badge.warning {
      background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
      color: #92400E;
      border: 2px solid #F59E0B;
    }
    .message-box { 
      background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
      border-left: 6px solid #DC2626;
      padding: 25px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .message-box h2 { 
      color: #1F2937; 
      font-size: 20px;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .message-box p { 
      color: #374151; 
      font-size: 16px;
      line-height: 1.7;
    }
    .details-section {
      margin-bottom: 30px;
    }
    .details-section h3 {
      font-size: 13px;
      color: #6B7280;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 15px;
    }
    .details-grid{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .detail-item{
      background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
      padding: 18px;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
      transition: all 0.3s ease;
    }
    .detail-item:hover {
      border-color: #DC2626;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
    }
    .detail-label{
      font-size: 11px;
      color: #9CA3AF;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .detail-value{
      font-size: 15px;
      color: #1F2937;
      font-weight: 600;
    }
    .action-buttons { 
      display: flex; 
      gap: 12px; 
      margin: 35px 0; 
      justify-content: center; 
      flex-wrap: wrap;
    }
    .btn { 
      display: inline-block; 
      padding: 14px 32px; 
      border-radius: 8px; 
      text-decoration: none; 
      font-weight: 700; 
      font-size: 14px; 
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .btn-primary { 
      background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
    }
    .btn-primary:hover { 
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
    }
    .btn-secondary { 
      background: white;
      color: #1F2937;
      border: 2px solid #E5E7EB;
    }
    .btn-secondary:hover { 
      border-color: #DC2626;
      color: #DC2626;
      background: #FEF2F2;
    }
    .info-box {
      background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%);
      border-left: 4px solid #10B981;
      padding: 18px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .info-box p {
      color: #065F46;
      font-size: 14px;
      line-height: 1.6;
    }
    .divider { 
      height: 2px; 
      background: linear-gradient(90deg, transparent, #E5E7EB, transparent);
      margin: 35px 0;
    }
    .footer { 
      background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%);
      padding: 40px 35px;
      text-align: center;
      border-top: 1px solid #E5E7EB;
    }
    .footer-logo { 
      margin-bottom: 20px;
    }
    .footer-logo a { 
      color: #DC2626; 
      text-decoration: none; 
      font-weight: 800; 
      font-size: 18px;
      letter-spacing: -0.5px;
      transition: all 0.3s ease;
    }
    .footer-logo a:hover { 
      color: #991B1B;
      text-decoration: underline;
    }
    .footer-divider {
      height: 1px;
      background: #E5E7EB;
      margin: 15px 0;
    }
    .footer-text { 
      color: #6B7280; 
      font-size: 13px; 
      line-height: 1.8;
    }
    .footer-text p {
      margin: 8px 0;
    }
    .footer-text a { 
      color: #DC2626; 
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .footer-text a:hover { 
      color: #991B1B;
      text-decoration: underline;
    }
    .company-info {
      background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-weight: 600;
      font-size: 14px;
    }
    .timestamp{
      color: #9CA3AF;
      font-size: 12px;
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
    }
    @media (max-width: 600px) {
      .container { border-radius: 8px; }
      .content { padding: 25px 20px; }
      .header { padding: 35px 20px; }
      .header h1 { font-size: 28px; }
      .details-grid { grid-template-columns: 1fr; }
      .action-buttons { flex-direction: column; }
      .btn { width: 100%; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <h1>{{step_2.severity_emoji}} {{step_2.alert_type}}</h1>
          <p>{{step_2.system_name}}</p>
        </div>
      </div>

      <!-- Content -->
      <div class="content">
        <!-- Alert Type Badge -->
        <div class="alert-type-badge {{step_2.alert_type|lower}}">
          {{step_2.severity_emoji}} {{step_2.alert_type}}: {{step_2.severity}}
        </div>

        <!-- Message -->
        <div class="message-box">
          <h2>{{step_2.message}}</h2>
        </div>

        <!-- Details Section -->
        <div class="details-section">
          <h3>📋 Alert Details</h3>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">🔧 Device</div>
              <div class="detail-value">{{step_2.device_id}}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">📍 Location</div>
              <div class="detail-value">{{step_2.location}}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">⚠️ Severity</div>
              <div class="detail-value">{{step_2.severity}}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">🕐 Time</div>
              <div class="detail-value">{{step_2.timestamp}}</div>
            </div>
          </div>
        </div>

        <!-- Info Box -->
        <div class="info-box">
          <p>
            ✓ This is an automated {{step_2.alert_type|lower}} from your FireGuard system. 
            Please review and take necessary action immediately.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <a href="{{step_2.dashboard_url}}" class="btn btn-primary">📊 View Dashboard</a>
          <a href="{{step_2.settings_url}}" class="btn btn-secondary">⚙️ Settings</a>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Footer -->
      <div class="footer">
        <!-- Company Info -->
        <div class="company-info">
          🏢 {{step_2.system_name}}
        </div>

        <!-- Footer Logo -->
        <div class="footer-logo">
          <a href="{{step_2.company_url}}">{{step_2.company_name}}</a>
        </div>

        <!-- Footer Divider -->
        <div class="footer-divider"></div>

        <!-- Footer Text -->
        <div class="footer-text">
          <p>Advanced Fire & Safety Monitoring System</p>
          <p style="margin-top: 12px;">
            <a href="{{step_2.company_url}}">Visit {{step_2.company_name}}</a> | 
            <a href="{{step_2.dashboard_url}}">Dashboard</a> | 
            <a href="{{step_2.settings_url}}">Settings</a>
          </p>
          <p style="margin-top: 15px; font-size: 11px; color: #9CA3AF;">
            © 2025 {{step_2.company_name}}. All rights reserved.<br>
            This email was sent to {{step_2.email}}<br>
            Sent: {{step_2.timestamp}}
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## Step 6: Test Gmail

1. **Click:** "Test & Continue"
2. **Should send test email**
3. **Check your Gmail inbox**
4. **Verify formatting looks professional**

---

## Step 7: Publish Zap

1. **Click:** "Publish"
2. **Zap is now LIVE** ✅
3. **Copy the webhook URL** (you'll need it for Supabase)

---

# PART 2: SUPABASE WEBHOOK SETUP

## Step 1: Get Zapier Webhook URL

From the Zapier Zap you just created:

1. **Go back to your Zap**
2. **Click on:** "Catch Raw Hook" step
3. **Copy the webhook URL**

Example: `https://hooks.zapier.com/hooks/catch/25309342/uz6mf62/`

---

## Step 2: Create Supabase Webhook

### Go to Supabase

1. **Open:** Supabase Dashboard
2. **Select your project**
3. **Go to:** Database → Webhooks

### Create New Webhook

1. **Click:** "Create a new webhook"

### Configure Webhook

Fill in these fields:

**Name:**
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

**URL:**
```
[Your Zapier webhook URL]
```

Replace with your actual URL from Step 1.

---

## Step 3: Create Webhook

1. **Click:** "Create webhook"
2. **Webhook is now active** ✅

---

# PART 3: TEST THE COMPLETE FLOW

## Step 1: Insert Test Alert

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO alerts (device_id, message, severity, email, temp, gas, humidity, flame, time, location)
VALUES (
  'ESP32_001',
  '🚨 CRITICAL: Flame detected in Building A - Floor 1',
  'critical',
  'ashivamone@gmail.com',
  65.2,
  800,
  45.3,
  0,
  NOW(),
  'Building A - Floor 1'
);
```

---

## Step 2: Check Zapier

1. **Go to your Zapier Zap**
2. **Click:** "Zap History"
3. **Should see:** New webhook received
4. **Check each step:**
   - ✅ Step 1: Webhook received
   - ✅ Step 2: Code executed
   - ✅ Step 3: Email sent

---

## Step 3: Check Gmail

1. **Wait 2-3 seconds**
2. **Check Gmail inbox**
3. **Should see email with:**
   - ✅ Subject: `🚨 Alert: CRITICAL - Flame detected...`
   - ✅ From: `FireGuard: Fire Safety & Evacuation Alert System`
   - ✅ Device, Location, Time details
   - ✅ Dashboard and Settings buttons
   - ✅ The GDevelopers branding
   - ✅ NO sensor data

---

## Step 4: Test Warning

Insert a warning alert:

```sql
INSERT INTO alerts (device_id, message, severity, email, temp, gas, humidity, flame, time, location)
VALUES (
  'ESP32_001',
  '⚡ WARNING: Temperature elevated in Building A - Floor 1',
  'medium',
  'ashivamone@gmail.com',
  35.5,
  250,
  72.0,
  1,
  NOW(),
  'Building A - Floor 1'
);
```

**Expected email:**
- Subject: `⚡ Warning: MEDIUM - Temperature elevated...`
- Type badge: "⚠️ Warning: MEDIUM"

---

# COMPLETE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPLETE ALERT EMAIL FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Alert Created in Supabase                                  │
│     INSERT INTO alerts (...)                                   │
│                                                                 │
│  2. Webhook Triggers (AFTER INSERT)                           │
│     POST to Zapier webhook URL                                │
│     Payload: {device_id, message, severity, email, ...}       │
│                                                                 │
│  3. Zapier Step 1: Catch Raw Hook                            │
│     Receives JSON from Supabase                               │
│                                                                 │
│  4. Zapier Step 2: Code by Zapier                            │
│     Formats data:                                              │
│     - Determines Alert vs Warning                             │
│     - Adds severity emoji & color                             │
│     - Adds URLs (dashboard, settings, company)                │
│     - Formats timestamp                                        │
│     - NO sensor data included                                 │
│                                                                 │
│  5. Zapier Step 3: Gmail                                     │
│     Sends professional HTML email:                            │
│     - From: FireGuard system name                            │
│     - Subject: {{emoji}} {{type}}: {{severity}} - {{message}} │
│     - Body: Professional template with details                │
│     - Includes: Device, Location, Time, URLs                 │
│     - Footer: The GDevelopers branding                        │
│                                                                 │
│  6. Email Delivered ✅                                         │
│     User receives formatted alert/warning                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# EMAIL EXAMPLES

## Alert Email

**Subject:** `🚨 Alert: CRITICAL - Flame detected in Building A - Floor 1`

**Body:**
```
🚨 Alert
FireGuard: Fire Safety & Evacuation Alert System

🚨 Alert: CRITICAL

Flame detected in Building A - Floor 1

Device: ESP32_001
Location: Building A - Floor 1
Severity: CRITICAL
Time: Nov 19, 2025 9:48:32 PM

[📊 View Dashboard] [⚙️ Settings]

This is an automated alert from your FireGuard system.
Please review and take necessary action.

---

The GDevelopers
FireGuard: Fire Safety & Evacuation Alert System

© 2025 The GDevelopers
Sent: Nov 19, 2025 9:48:32 PM
```

---

## Warning Email

**Subject:** `⚡ Warning: MEDIUM - Temperature elevated in Building A - Floor 1`

**Body:**
```
⚡ Warning
FireGuard: Fire Safety & Evacuation Alert System

⚡ Warning: MEDIUM

Temperature elevated in Building A - Floor 1

Device: ESP32_001
Location: Building A - Floor 1
Severity: MEDIUM
Time: Nov 19, 2025 9:50:15 PM

[📊 View Dashboard] [⚙️ Settings]

This is an automated warning from your FireGuard system.
Please review and take necessary action.

---

The GDevelopers
FireGuard: Fire Safety & Evacuation Alert System

© 2025 The GDevelopers
Sent: Nov 19, 2025 9:50:15 PM
```

---

# CHECKLIST

## Zapier Setup
- [ ] Created new Zap
- [ ] Added Webhook trigger (Catch Raw Hook)
- [ ] Copied webhook URL
- [ ] Added Code by Zapier step
- [ ] Pasted JavaScript code
- [ ] Tested Code step
- [ ] Added Gmail action
- [ ] Configured all Gmail fields
- [ ] Tested Gmail action
- [ ] Published Zap

## Supabase Setup
- [ ] Copied Zapier webhook URL
- [ ] Created Supabase webhook
- [ ] Set table to "alerts"
- [ ] Set event to "INSERT"
- [ ] Pasted Zapier URL
- [ ] Created webhook

## Testing
- [ ] Inserted test alert (CRITICAL)
- [ ] Checked Zapier history
- [ ] Received email in Gmail
- [ ] Verified subject line
- [ ] Verified from name
- [ ] Verified device/location/time
- [ ] Verified buttons work
- [ ] Verified The GDevelopers branding
- [ ] Verified NO sensor data
- [ ] Inserted test warning
- [ ] Received warning email
- [ ] Verified "Warning" type

---

# STATUS

✅ **Complete setup guide created**
✅ **Zapier Zap configured**
✅ **Code by Zapier step ready**
✅ **Professional email template**
✅ **Supabase webhook setup**
✅ **Alert vs Warning differentiation**
✅ **The GDevelopers branding**
✅ **All URLs included**
✅ **No sensor data**

**You're ready to deploy! 🎉**

Follow the steps above from zero and you'll have a complete alert email system!
