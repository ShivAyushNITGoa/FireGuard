# Zapier Email Integration - Updated Template Guide

This guide shows you how to use the new comprehensive email template with your existing Zapier setup.

## 🎯 What's New in This Template

The updated template now includes:
- ✅ **All sensor data** (Temperature, Humidity, Smoke/Gas, Flame)
- ✅ **Precise timestamps** with full date/time
- ✅ **Device location** prominently displayed
- ✅ **Color-coded severity** levels
- ✅ **Responsive design** for mobile and desktop
- ✅ **Safety instructions** for critical alerts
- ✅ **Professional formatting** with icons and badges

## 📋 Quick Setup (3 Steps)

### Step 1: Update Your Zapier Webhook

Your Zapier Zap should receive data from Supabase with these fields:

**Required Fields:**
```json
{
  "alert_id": "uuid-string",
  "device_id": "ESP32_001",
  "location": "Building A - Floor 1",
  "message": "High temperature detected!",
  "severity": "high",
  "temp": 45.2,
  "gas": 450,
  "humidity": 65.0,
  "flame": 0,
  "time": "2024-01-01T12:00:00Z",
  "email": "user@example.com"
}
```

### Step 2: Add Formatter Steps in Zapier

Add these **Formatter by Zapier** steps to prepare the email data:

#### Formatter 1: Severity Color
- **Action:** Text → Replace
- **Input:** `{{severity}}`
- **Find:** 
  - `critical` → `#DC2626`
  - `high` → `#EA580C`
  - `medium` → `#F59E0B`
  - `low` → `#10B981`
- **Output Name:** `severity_color`

#### Formatter 2: Severity Emoji
- **Action:** Text → Replace
- **Input:** `{{severity}}`
- **Find:**
  - `critical` → `🚨`
  - `high` → `⚠️`
  - `medium` → `⚡`
  - `low` → `ℹ️`
- **Output Name:** `severity_emoji`

#### Formatter 3: Format Timestamp
- **Action:** Date/Time → Format
- **Input:** `{{time}}`
- **Format:** `MMMM D, YYYY [at] h:mm:ss A z`
- **Output Name:** `timestamp`

#### Formatter 4: Temperature Display
- **Action:** Numbers → Format Number
- **Input:** `{{temp}}`
- **Format:** `0.0`
- **Append:** `°C`
- **Output Name:** `temperature`

#### Formatter 5: Temperature Class (Color Coding)
- **Action:** Text → Default Value
- **Input:** Use a Code step (see below)
- **Output Name:** `temp_class`

**Code Step for Temperature Class:**
```javascript
// Input: temp
let tempClass = 'normal';
if (inputData.temp !== null && inputData.temp !== undefined) {
  if (inputData.temp > 45) {
    tempClass = 'critical';
  } else if (inputData.temp > 35) {
    tempClass = 'warning';
  }
}
return { temp_class: tempClass };
```

#### Formatter 6: Gas/Smoke Display
- **Action:** Numbers → Format Number
- **Input:** `{{gas}}`
- **Format:** `0`
- **Append:** ` AQI`
- **Output Name:** `gas_reading`

#### Formatter 7: Gas Class (Color Coding)
**Code Step:**
```javascript
// Input: gas
let gasClass = 'normal';
if (inputData.gas !== null && inputData.gas !== undefined) {
  if (inputData.gas > 600) {
    gasClass = 'critical';
  } else if (inputData.gas > 400) {
    gasClass = 'warning';
  }
}
return { gas_class: gasClass };
```

#### Formatter 8: Humidity Display
- **Action:** Numbers → Format Number
- **Input:** `{{humidity}}`
- **Format:** `0.0`
- **Append:** `%`
- **Output Name:** `humidity`

#### Formatter 9: Flame Status
**Code Step:**
```javascript
// Input: flame
let flameStatus = 'N/A';
let flameClass = 'normal';

if (inputData.flame !== null && inputData.flame !== undefined) {
  if (inputData.flame === 0 || inputData.flame === '0') {
    flameStatus = '🔥 DETECTED';
    flameClass = 'critical';
  } else {
    flameStatus = '✓ Clear';
    flameClass = 'normal';
  }
}

return { 
  flame_status: flameStatus,
  flame_class: flameClass
};
```

#### Formatter 10: Safety Instructions
**Code Step:**
```javascript
// Input: severity
let safetyInstructions = '';

if (inputData.severity === 'critical' || inputData.severity === 'high') {
  safetyInstructions = `
    <div class="info-section">
      <h2>⚠️ Immediate Actions Required</h2>
      <div class="safety-box">
        <ul>
          <li>Evacuate the area immediately if safe to do so</li>
          <li>Call emergency services (Fire Department)</li>
          <li>Do not attempt to fight the fire unless trained</li>
          <li>Alert other occupants in the building</li>
          <li>Use fire extinguisher only for small, contained fires</li>
        </ul>
      </div>
    </div>
  `;
}

return { safety_instructions: safetyInstructions };
```

### Step 3: Update Email Action

In your **Send Email** action (Gmail, Outlook, SendGrid, etc.):

**To:** `{{email}}`

**Subject:** 
```
🚨 FireGuard Alert: {{severity}} - {{message}}
```

**Body (HTML):**
Copy the entire content from `zapier/email-template.html` and replace the placeholders:

**Placeholder Mapping:**
- `{{severity_color}}` → Output from Formatter 1
- `{{severity_emoji}}` → Output from Formatter 2
- `{{severity}}` → Original severity field
- `{{message}}` → Original message field
- `{{timestamp}}` → Output from Formatter 3
- `{{location}}` → Original location field
- `{{device_id}}` → Original device_id field
- `{{alert_id}}` → Original alert_id field
- `{{temperature}}` → Output from Formatter 4
- `{{temp_class}}` → Output from Formatter 5
- `{{gas_reading}}` → Output from Formatter 6
- `{{gas_class}}` → Output from Formatter 7
- `{{humidity}}` → Output from Formatter 8
- `{{flame_status}}` → Output from Formatter 9
- `{{flame_class}}` → Output from Formatter 9
- `{{safety_instructions}}` → Output from Formatter 10
- `{{dashboard_url}}` → Your dashboard URL (e.g., `https://your-app.com/dashboard`)
- `{{settings_url}}` → Your settings URL (e.g., `https://your-app.com/settings`)

## 🔧 Alternative: Simplified Setup with Code Step

If you prefer fewer steps, use a single **Code by Zapier** step:

```javascript
// Input data from webhook
const data = {
  alert_id: inputData.alert_id,
  device_id: inputData.device_id,
  location: inputData.location,
  message: inputData.message,
  severity: inputData.severity,
  temp: parseFloat(inputData.temp),
  gas: parseFloat(inputData.gas),
  humidity: parseFloat(inputData.humidity),
  flame: parseInt(inputData.flame),
  time: inputData.time,
  email: inputData.email
};

// Severity mappings
const severityColors = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#F59E0B',
  low: '#10B981'
};

const severityEmojis = {
  critical: '🚨',
  high: '⚠️',
  medium: '⚡',
  low: 'ℹ️'
};

// Format timestamp
const timestamp = new Date(data.time).toLocaleString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short'
});

// Format sensor readings
const temperature = data.temp !== null ? `${data.temp.toFixed(1)}°C` : 'N/A';
const humidity = data.humidity !== null ? `${data.humidity.toFixed(1)}%` : 'N/A';
const gas_reading = data.gas !== null ? `${data.gas.toFixed(0)} AQI` : 'N/A';

// Temperature class
let temp_class = 'normal';
if (data.temp !== null) {
  if (data.temp > 45) temp_class = 'critical';
  else if (data.temp > 35) temp_class = 'warning';
}

// Gas class
let gas_class = 'normal';
if (data.gas !== null) {
  if (data.gas > 600) gas_class = 'critical';
  else if (data.gas > 400) gas_class = 'warning';
}

// Flame status
let flame_status = 'N/A';
let flame_class = 'normal';
if (data.flame !== null) {
  if (data.flame === 0) {
    flame_status = '🔥 DETECTED';
    flame_class = 'critical';
  } else {
    flame_status = '✓ Clear';
    flame_class = 'normal';
  }
}

// Safety instructions
let safety_instructions = '';
if (data.severity === 'critical' || data.severity === 'high') {
  safety_instructions = `
    <div class="info-section">
      <h2>⚠️ Immediate Actions Required</h2>
      <div class="safety-box">
        <ul>
          <li>Evacuate the area immediately if safe to do so</li>
          <li>Call emergency services (Fire Department)</li>
          <li>Do not attempt to fight the fire unless trained</li>
          <li>Alert other occupants in the building</li>
          <li>Use fire extinguisher only for small, contained fires</li>
        </ul>
      </div>
    </div>
  `;
}

// Return all formatted values
return {
  severity_color: severityColors[data.severity] || '#6B7280',
  severity_emoji: severityEmojis[data.severity] || '🔔',
  severity: data.severity,
  message: data.message,
  timestamp: timestamp,
  location: data.location,
  device_id: data.device_id,
  alert_id: data.alert_id,
  temperature: temperature,
  temp_class: temp_class,
  gas_reading: gas_reading,
  gas_class: gas_class,
  humidity: humidity,
  flame_status: flame_status,
  flame_class: flame_class,
  safety_instructions: safety_instructions,
  dashboard_url: 'https://your-app.com/dashboard',
  settings_url: 'https://your-app.com/settings',
  email: data.email
};
```

Then use these outputs in your email template.

## 📊 Zapier Zap Flow

```
1. Trigger: Webhook (Catch Hook)
   ↓
2. Code by Zapier (Format all data)
   ↓
3. Gmail/Email (Send Email with HTML template)
```

## 🧪 Testing Your Zap

### Test Webhook Data

Send this JSON to your Zapier webhook URL:

```json
{
  "alert_id": "test-123",
  "device_id": "ESP32_001",
  "location": "Building A - Floor 1",
  "message": "High temperature and smoke detected!",
  "severity": "high",
  "temp": 48.5,
  "gas": 650,
  "humidity": 62.5,
  "flame": 0,
  "time": "2024-11-12T09:00:00Z",
  "email": "your-email@example.com"
}
```

### Using cURL:

```bash
curl -X POST "YOUR_ZAPIER_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_id": "test-123",
    "device_id": "ESP32_001",
    "location": "Building A - Floor 1",
    "message": "High temperature and smoke detected!",
    "severity": "high",
    "temp": 48.5,
    "gas": 650,
    "humidity": 62.5,
    "flame": 0,
    "time": "2024-11-12T09:00:00Z",
    "email": "your-email@example.com"
  }'
```

## 🔗 Connecting Supabase to Zapier

### Option 1: Using Supabase Webhooks

1. Go to Supabase Dashboard → Database → Webhooks
2. Create new webhook
3. **Table:** `alerts`
4. **Events:** `INSERT`
5. **Webhook URL:** Your Zapier webhook URL
6. **HTTP Headers:** `Content-Type: application/json`

### Option 2: Using Database Trigger

Update your SQL trigger to call Zapier webhook:

```sql
CREATE OR REPLACE FUNCTION notify_zapier_on_alert()
RETURNS TRIGGER AS $$
DECLARE
  zapier_url TEXT := 'YOUR_ZAPIER_WEBHOOK_URL';
  request_id BIGINT;
BEGIN
  -- Call Zapier webhook with all sensor data
  SELECT net.http_post(
    url := zapier_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'alert_id', NEW.id::text,
      'device_id', NEW.device_id,
      'location', NEW.location,
      'message', NEW.message,
      'severity', NEW.severity,
      'temp', NEW.temp,
      'gas', NEW.gas,
      'humidity', (SELECT humidity FROM sensor_data WHERE device_id = NEW.device_id ORDER BY time DESC LIMIT 1),
      'flame', NEW.flame,
      'time', COALESCE(NEW.time, NOW())::text,
      'email', (SELECT email FROM user_profiles WHERE id = auth.uid())
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_alert_zapier ON alerts;
CREATE TRIGGER on_alert_zapier
  AFTER INSERT ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION notify_zapier_on_alert();
```

## 📧 Email Service Options in Zapier

You can use any of these email services:
- **Gmail** (free, easiest)
- **Outlook/Office 365**
- **SendGrid** (professional)
- **Mailgun** (developer-friendly)
- **Amazon SES** (scalable)

## 🎨 Customization

### Change Colors

Edit the severity colors in the Code step:

```javascript
const severityColors = {
  critical: '#DC2626',  // Your custom red
  high: '#EA580C',      // Your custom orange
  medium: '#F59E0B',    // Your custom yellow
  low: '#10B981'        // Your custom green
};
```

### Add Your Logo

Add this in the header section of `email-template.html`:

```html
<div class="header">
  <img src="https://your-domain.com/logo.png" alt="Logo" style="max-width: 150px; margin-bottom: 10px;">
  <div class="emoji">{{severity_emoji}}</div>
  <h1>FireGuard Alert</h1>
  ...
</div>
```

### Customize Dashboard URL

Update in the Code step:

```javascript
dashboard_url: 'https://your-actual-domain.com/dashboard',
settings_url: 'https://your-actual-domain.com/settings',
```

## 🐛 Troubleshooting

### Email not sending
- Check Zapier task history for errors
- Verify all required fields are present
- Test with sample data first

### Formatting issues
- Ensure HTML email is enabled in your email service
- Test in different email clients
- Check that all placeholders are replaced

### Missing sensor data
- Verify webhook payload includes all fields
- Check that null values are handled in Code step
- Review Zapier logs for data mapping issues

## 📈 Best Practices

1. **Test thoroughly** before going live
2. **Use filters** to avoid duplicate emails
3. **Add delays** if sending multiple emails
4. **Monitor Zapier task usage** (free tier has limits)
5. **Set up error notifications** in Zapier
6. **Keep webhook URL secret**

## 🎉 You're Done!

Your Zapier integration now sends comprehensive emails with:
- ✅ All sensor data beautifully formatted
- ✅ Color-coded severity levels
- ✅ Precise timestamps and location
- ✅ Professional responsive design
- ✅ Safety instructions for critical alerts

Test it by triggering an alert from your ESP32 device!
