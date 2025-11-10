# Troubleshooting Guide

## 🔴 Issue: "Error saving settings"

### Cause
The `device_settings` table doesn't exist in your Supabase database yet.

### Solution
Run the complete setup script in Supabase SQL Editor:

**File:** `COMPLETE-SETUP.sql`

This will:
1. ✅ Fix NULL constraints on `sensor_data` table
2. ✅ Create `device_settings` table
3. ✅ Set up default thresholds for all devices

---

## 🔴 Issue: ESP32 getting HTTP 400 error

### Error Message
```
null value in column "gas" of relation "sensor_data" violates not-null constraint
```

### Cause
The `sensor_data` table has NOT NULL constraints, but ESP32 is correctly sending `null` for disconnected sensors.

### Solution
Run `COMPLETE-SETUP.sql` or just `fix-sensor-data-null.sql`

---

## 🔴 Issue: Device showing as "Offline"

### Possible Causes

#### 1. ESP32 Not Sending Data
**Check:**
- Is ESP32 powered on?
- Is WiFi connected? (Check Serial Monitor)
- Is ESP32 getting HTTP errors?

**Serial Monitor Should Show:**
```
✓ Sensor data sent (HTTP 201)
```

**If showing HTTP 400:**
- Run `COMPLETE-SETUP.sql` to fix NULL constraints

#### 2. Data Not Reaching Supabase
**Check in Supabase:**
```sql
SELECT * FROM sensor_data 
ORDER BY time DESC 
LIMIT 5;
```

**If no data:**
- Check ESP32 WiFi connection
- Verify Supabase URL and API key in ESP32 code

**If data exists:**
- Check `last_seen` timestamp
- Device shows offline if no data for 60+ seconds

#### 3. Wrong Device ID
**Check:**
```sql
-- Check what device_id ESP32 is using
SELECT DISTINCT device_id FROM sensor_data 
ORDER BY time DESC;

-- Check what device_id exists in devices table
SELECT device_id, status FROM devices;
```

**If mismatch:**
- Update ESP32 code to use correct device_id
- Or add device to `devices` table

---

## 🔴 Issue: Thresholds Not Working

### Symptoms
- Settings page loads but thresholds don't apply
- Alerts not created when thresholds exceeded

### Possible Causes

#### 1. Threshold Monitoring Not Running
**Check browser console:**
```
Should see: "🔍 Starting threshold monitoring service..."
```

**If not running:**
- Refresh the dashboard page
- Check for JavaScript errors in console

#### 2. No Settings for Device
**Check in Supabase:**
```sql
SELECT * FROM device_settings 
WHERE device_id = 'ESP32_001';
```

**If no results:**
```sql
-- Insert default settings
INSERT INTO device_settings (device_id)
VALUES ('ESP32_001');
```

#### 3. Alerts Table Issues
**Check if alerts are being created:**
```sql
SELECT * FROM alerts 
ORDER BY time DESC 
LIMIT 5;
```

**If no alerts despite exceeding thresholds:**
- Check browser console for errors
- Verify threshold monitoring service is running
- Check alert cooldown period (default 60s)

---

## 🔴 Issue: Web App Not Loading

### Possible Causes

#### 1. Next.js Build Errors
**Check terminal for errors:**
```
npm run dev
```

**Common errors:**
- Missing dependencies: `npm install`
- Port already in use: Kill process on port 3000
- Webpack errors: Run `fix-nextjs.ps1`

#### 2. Environment Variables Missing
**Check `.env.local` exists:**
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

**If missing:**
- Copy from `.env.example`
- Add your Supabase credentials

---

## 🔴 Issue: Sensor Showing Wrong Values

### Gas Sensor Showing 100 PPM Default
**This was fixed!** 

**If still happening:**
1. Check ESP32 firmware has the fix
2. Clear old data: Run `clear-old-data.sql`
3. Reset ESP32

### Sensor Showing "N/A" When Connected
**Check:**
1. Is sensor physically connected?
2. Check Serial Monitor for sensor readings
3. Verify sensor is working (test with multimeter)

**For DHT11:**
```
Should see in Serial Monitor:
Temp: 26.8°C
Humidity: 72.3%
```

**For MQ-2:**
```
Should see in Serial Monitor:
Gas: 234.5 PPM
```

**If showing "N/A" in Serial Monitor:**
- Sensor not detected or not working
- Check wiring and connections

---

## 🔧 Quick Fixes

### Reset Everything
```sql
-- Clear all sensor data
DELETE FROM sensor_data;

-- Clear all alerts
DELETE FROM alerts;

-- Reset device status
UPDATE devices SET status = 'offline';

-- Reset device settings to defaults
DELETE FROM device_settings;
INSERT INTO device_settings (device_id)
SELECT device_id FROM devices;
```

### Check Database Status
```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should see:
-- - alerts
-- - device_settings
-- - devices
-- - sensor_data
```

### Verify NULL Constraints Fixed
```sql
SELECT 
  table_name,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('sensor_data', 'alerts')
  AND column_name IN ('gas', 'temp', 'humidity', 'flame')
ORDER BY table_name, column_name;

-- is_nullable should be 'YES' for all
```

---

## 📋 Setup Checklist

Use this to verify everything is set up correctly:

### Database Setup
- [ ] `sensor_data` table allows NULL values
- [ ] `device_settings` table exists
- [ ] Default thresholds created for all devices
- [ ] Row Level Security policies set up

### ESP32 Setup
- [ ] WiFi credentials configured
- [ ] Supabase URL and API key configured
- [ ] Device ID matches database
- [ ] Sensors connected and working
- [ ] Serial Monitor shows HTTP 201 success

### Web App Setup
- [ ] `.env.local` file exists with Supabase credentials
- [ ] Dependencies installed (`npm install`)
- [ ] App running (`npm run dev`)
- [ ] Dashboard shows device as online
- [ ] Settings page loads without errors
- [ ] Can save threshold settings

### Threshold Monitoring
- [ ] Threshold monitoring service starts on dashboard load
- [ ] Browser console shows "🔍 Starting threshold monitoring..."
- [ ] Alerts created when thresholds exceeded
- [ ] Alert cooldown working (no spam)

---

## 🆘 Still Having Issues?

### Check These Files
1. **COMPLETE-SETUP.sql** - Run this first to set up everything
2. **FIX-OFFLINE-DEVICE.md** - Detailed guide for offline device issues
3. **THRESHOLD-SETTINGS-GUIDE.md** - Complete threshold system documentation
4. **QUICK-THRESHOLD-SETUP.md** - Quick start guide

### Common Command Reference

**Supabase SQL Editor:**
```sql
-- Check recent sensor data
SELECT * FROM sensor_data ORDER BY time DESC LIMIT 10;

-- Check device status
SELECT device_id, status, last_seen FROM devices;

-- Check device settings
SELECT * FROM device_settings;

-- Check recent alerts
SELECT * FROM alerts ORDER BY time DESC LIMIT 10;
```

**ESP32 Serial Monitor:**
```
Look for:
✓ WiFi connected
✓ Sensor data sent (HTTP 201)
✓ Device registered/updated
```

**Browser Console:**
```
Look for:
🔍 Starting threshold monitoring service...
✓ Threshold monitoring active
```

---

## 📞 Debug Mode

Enable detailed logging:

### Browser Console
```javascript
// In browser console
localStorage.setItem('debug', 'true')
// Reload page
```

### ESP32 Serial Monitor
- Set baud rate to 115200
- Enable timestamps
- Look for detailed sensor readings

---

## ✅ Everything Working Checklist

When everything is working correctly, you should see:

### ESP32 Serial Monitor:
```
📊 Reading sensors...
  Gas: 234.5 PPM (or N/A if not connected)
  Temp: 26.8°C
  Humidity: 72.3%
  Flame: Clear

📤 Sending to Supabase...
✓ Sensor data sent (HTTP 201)
✓ Device registered/updated (HTTP 201)
```

### Web Dashboard:
```
Device Status: Online ✓
Last Seen: Just now

Gas: 234.5 PPM (or N/A)
Temperature: 26.8°C
Humidity: 72.3%
Flame: 0%
```

### Settings Page:
```
✓ Page loads without errors
✓ Current thresholds displayed
✓ Can modify thresholds
✓ "Save Thresholds" button works
✓ Success message appears after save
```

### Alerts:
```
✓ Alerts created when thresholds exceeded
✓ Correct severity level (warning/danger)
✓ Cooldown prevents spam
✓ Alerts appear on dashboard
```

---

If you've followed all steps and still have issues, double-check:
1. Supabase credentials are correct
2. ESP32 WiFi is connected
3. All SQL scripts have been run
4. Web app is running without errors
5. Browser console shows no errors
