# 📧 Zapier Gmail Body Setup - Copy & Paste Guide

## ⚠️ Important: How to Paste HTML in Zapier

The HTML template must be pasted **correctly** into Zapier's Gmail Body field.

---

## Step 1: Open Your Zap

1. **Go to:** https://zapier.com
2. **Open your alert Zap**
3. **Click on:** Gmail action step
4. **Find:** Body field

---

## Step 2: Get the HTML Template

### Option A: From File (Recommended)

1. **Open:** `EMAIL_TEMPLATE_COPY_PASTE.html` in your project
2. **Select All:** `Ctrl+A`
3. **Copy:** `Ctrl+C`

### Option B: From Markdown

1. **Open:** `COMPLETE_SETUP_GUIDE.md`
2. **Find:** Section "Step 5: Configure Gmail Fields"
3. **Copy the entire HTML block** (from `<!DOCTYPE html>` to `</html>`)

---

## Step 3: Paste into Zapier

### In Gmail Body Field:

1. **Click in:** Body field
2. **Clear any existing content**
3. **Paste:** `Ctrl+V`
4. **Result:** Full HTML template appears

---

## Step 4: Verify Template

After pasting, you should see:

✅ **Header section** with red gradient
✅ **Alert Type Badge** section
✅ **Message Box** section
✅ **Details Grid** with Device, Location, Severity, Time
✅ **Action Buttons** (View Dashboard, Settings)
✅ **Footer** with The GDevelopers branding
✅ **All Zapier placeholders** like `{{step_2.device_id}}`

---

## Step 5: Test

1. **Click:** "Test & Continue"
2. **Check:** Test email in Gmail
3. **Verify:** Professional design renders correctly

---

## 🔧 Troubleshooting

### Issue: "Syntax Error" Message

**Solution:**
- Make sure you copied the **entire** HTML (from `<!DOCTYPE` to `</html>`)
- Don't include markdown code fence markers (` ``` `)
- Paste as plain text, not formatted text

### Issue: Template Looks Broken

**Solution:**
- Clear the Body field completely
- Paste the template again
- Make sure all `{{step_2.*}}` placeholders are intact

### Issue: Placeholders Not Working

**Solution:**
- Verify you're using `{{step_2.device_id}}` format
- Check that Code by Zapier step (step_2) is configured correctly
- Test the Code step first to ensure it outputs data

---

## 📋 Template Placeholders Reference

All these must be present in your template:

```
{{step_2.severity_emoji}}      - Emoji (🚨, ⚠️, ⚡, ℹ️)
{{step_2.alert_type}}          - "Alert" or "Warning"
{{step_2.severity}}            - "CRITICAL", "HIGH", "MEDIUM", "LOW"
{{step_2.message}}             - Alert message text
{{step_2.device_id}}           - Device identifier
{{step_2.location}}            - Location name
{{step_2.timestamp}}           - Formatted date/time
{{step_2.dashboard_url}}       - Dashboard link
{{step_2.settings_url}}        - Settings link
{{step_2.company_url}}         - Company website
{{step_2.company_name}}        - "The GDevelopers"
{{step_2.system_name}}         - "FireGuard: Fire Safety & Evacuation Alert System"
{{step_2.email}}               - Recipient email
```

---

## ✅ Complete Checklist

- [ ] Opened `EMAIL_TEMPLATE_COPY_PASTE.html`
- [ ] Copied entire HTML content
- [ ] Pasted into Zapier Gmail Body field
- [ ] Verified all sections are visible
- [ ] Verified all placeholders are present
- [ ] Tested email
- [ ] Email renders professionally
- [ ] The GDevelopers branding visible
- [ ] Dashboard and Settings buttons work
- [ ] Published Zap

---

## 🎯 Quick Copy-Paste Steps

1. **Open file:** `EMAIL_TEMPLATE_COPY_PASTE.html`
2. **Select all:** `Ctrl+A`
3. **Copy:** `Ctrl+C`
4. **Go to Zapier Gmail Body field**
5. **Paste:** `Ctrl+V`
6. **Test & Continue**
7. **Publish**

Done! ✅

---

## 📧 Expected Email Output

### Subject Line
```
🚨 Alert: CRITICAL - Flame detected in Building A - Floor 1
```

### Email Preview
```
┌─────────────────────────────────────────┐
│                                         │
│  🚨 Alert                               │
│  FireGuard: Fire Safety & Evacuation... │
│                                         │
│  🚨 Alert: CRITICAL                    │
│                                         │
│  Flame detected in Building A - Floor 1 │
│                                         │
│  📋 Alert Details                       │
│  🔧 Device: ESP32_001                   │
│  📍 Location: Building A - Floor 1      │
│  ⚠️ Severity: CRITICAL                 │
│  🕐 Time: Nov 19, 2025 9:48:32 PM      │
│                                         │
│  [📊 View Dashboard] [⚙️ Settings]     │
│                                         │
│  The GDevelopers                        │
│  https://thegdevelopers.info/           │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🚀 Status

✅ **HTML template ready**
✅ **Copy-paste file created**
✅ **Setup guide provided**
✅ **Ready to deploy**

**Follow the steps above and your professional email will be live! 🎉**
