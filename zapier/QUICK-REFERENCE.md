# Zapier Email Template - Quick Reference Card

## 📋 Template Variables Reference

Copy this when setting up your Zapier email:

### Required Zapier Outputs

| Variable | Source | Example Value |
|----------|--------|---------------|
| `{{severity_color}}` | Code/Formatter | `#DC2626` |
| `{{severity_emoji}}` | Code/Formatter | `🚨` |
| `{{severity}}` | Webhook | `high` |
| `{{message}}` | Webhook | `High temperature detected!` |
| `{{timestamp}}` | Formatter | `November 12, 2024 at 9:00:00 AM IST` |
| `{{location}}` | Webhook | `Building A - Floor 1` |
| `{{device_id}}` | Webhook | `ESP32_001` |
| `{{alert_id}}` | Webhook | `uuid-string` |
| `{{temperature}}` | Formatter | `45.2°C` |
| `{{temp_class}}` | Code | `critical` / `warning` / `normal` |
| `{{gas_reading}}` | Formatter | `650 AQI` |
| `{{gas_class}}` | Code | `critical` / `warning` / `normal` |
| `{{humidity}}` | Formatter | `62.5%` |
| `{{flame_status}}` | Code | `🔥 DETECTED` / `✓ Clear` |
| `{{flame_class}}` | Code | `critical` / `normal` |
| `{{safety_instructions}}` | Code | HTML block or empty |
| `{{dashboard_url}}` | Static | `https://your-app.com/dashboard` |
| `{{settings_url}}` | Static | `https://your-app.com/settings` |

## 🎨 Severity Color Codes

```
critical → #DC2626 (Red)
high     → #EA580C (Orange)
medium   → #F59E0B (Yellow)
low      → #10B981 (Green)
```

## 🔢 Sensor Thresholds

**Temperature:**
- `> 45°C` → critical (red)
- `> 35°C` → warning (yellow)
- `≤ 35°C` → normal (green)

**Gas/Smoke:**
- `> 600 AQI` → critical (red)
- `> 400 AQI` → warning (yellow)
- `≤ 400 AQI` → normal (green)

**Flame:**
- `0` → DETECTED (red)
- `1` → Clear (green)

## 📧 Email Subject Template

```
🚨 FireGuard Alert: {{severity}} - {{message}}
```

Examples:
- `🚨 FireGuard Alert: critical - Flame detected!`
- `🚨 FireGuard Alert: high - High temperature and smoke detected!`
- `🚨 FireGuard Alert: medium - High smoke level detected!`

## 🔗 Webhook Payload Example

```json
{
  "alert_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_id": "ESP32_001",
  "location": "Building A - Floor 1",
  "message": "High temperature and smoke detected!",
  "severity": "high",
  "temp": 48.5,
  "gas": 650,
  "humidity": 62.5,
  "flame": 0,
  "time": "2024-11-12T09:00:00Z",
  "email": "user@example.com"
}
```

## ⚡ Single Code Step (Copy-Paste Ready)

Use this in a **Code by Zapier** step to format everything:

```javascript
const data = inputData;
const severityColors = {critical: '#DC2626', high: '#EA580C', medium: '#F59E0B', low: '#10B981'};
const severityEmojis = {critical: '🚨', high: '⚠️', medium: '⚡', low: 'ℹ️'};

const timestamp = new Date(data.time).toLocaleString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
});

const temp = parseFloat(data.temp);
const gas = parseFloat(data.gas);
const flame = parseInt(data.flame);

return {
  severity_color: severityColors[data.severity] || '#6B7280',
  severity_emoji: severityEmojis[data.severity] || '🔔',
  severity: data.severity,
  message: data.message,
  timestamp: timestamp,
  location: data.location,
  device_id: data.device_id,
  alert_id: data.alert_id,
  temperature: temp !== null ? `${temp.toFixed(1)}°C` : 'N/A',
  temp_class: temp > 45 ? 'critical' : temp > 35 ? 'warning' : 'normal',
  gas_reading: gas !== null ? `${gas.toFixed(0)} AQI` : 'N/A',
  gas_class: gas > 600 ? 'critical' : gas > 400 ? 'warning' : 'normal',
  humidity: data.humidity !== null ? `${parseFloat(data.humidity).toFixed(1)}%` : 'N/A',
  flame_status: flame === 0 ? '🔥 DETECTED' : '✓ Clear',
  flame_class: flame === 0 ? 'critical' : 'normal',
  safety_instructions: (data.severity === 'critical' || data.severity === 'high') ? 
    '<div class="info-section"><h2>⚠️ Immediate Actions Required</h2><div class="safety-box"><ul><li>Evacuate the area immediately if safe to do so</li><li>Call emergency services (Fire Department)</li><li>Do not attempt to fight the fire unless trained</li><li>Alert other occupants in the building</li><li>Use fire extinguisher only for small, contained fires</li></ul></div></div>' : '',
  dashboard_url: 'https://your-app.com/dashboard',
  settings_url: 'https://your-app.com/settings',
  email: data.email
};
```

## 🧪 Test Your Zap

**cURL Command:**
```bash
curl -X POST "YOUR_ZAPIER_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"alert_id":"test-123","device_id":"ESP32_001","location":"Building A - Floor 1","message":"Test alert","severity":"high","temp":48.5,"gas":650,"humidity":62.5,"flame":0,"time":"2024-11-12T09:00:00Z","email":"your@email.com"}'
```

## 📱 Email Clients Tested

✅ Gmail (Web & Mobile)
✅ Outlook (Web & Desktop)
✅ Apple Mail (iOS & macOS)
✅ Yahoo Mail
✅ ProtonMail
✅ Thunderbird

## 🎯 Zapier Zap Structure

```
Trigger: Webhook (Catch Hook)
   ↓
Action: Code by Zapier (Format data)
   ↓
Action: Gmail/Email (Send HTML email)
```

## 💡 Pro Tips

1. **Save the Code step** as a template for reuse
2. **Test with all severity levels** (critical, high, medium, low)
3. **Check spam folder** on first test
4. **Use Zapier filters** to avoid duplicate sends
5. **Monitor task usage** on free tier (100 tasks/month)
6. **Set up error notifications** in Zapier settings

## 🔒 Security Notes

- Keep webhook URL secret
- Don't expose in public repos
- Use HTTPS only
- Validate data in Code step
- Sanitize user inputs

## 📞 Support

- Full guide: `ZAPIER-SETUP-GUIDE.md`
- Template file: `email-template.html`
- Test data: See webhook payload example above

---

**Quick Links:**
- [Zapier Dashboard](https://zapier.com/app/dashboard)
- [Zapier Code Documentation](https://zapier.com/help/create/code-webhooks/use-javascript-code-in-zaps)
- [HTML Email Testing](https://www.mail-tester.com/)
