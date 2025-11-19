# 🔗 Connect Supabase to Zapier Webhook

## Your Zapier Webhook URL

```
https://hooks.zapier.com/hooks/catch/25309342/uztemv4/
```

**Save this URL** - You'll need it for Supabase.

---

# Step 1: Go to Supabase

1. **Open:** https://supabase.com
2. **Sign in** to your project
3. **Select:** Your FireGuard project

---

# Step 2: Create Webhook

### Navigate to Webhooks

1. **Click:** Database (left sidebar)
2. **Click:** Webhooks
3. **Click:** "Create a new webhook"

---

# Step 3: Configure Webhook

### Webhook Name

```
alert-to-zapier
```

### Table

```
alerts
```

### Events

Select these checkboxes:
- ✅ INSERT (checked)
- ❌ UPDATE (unchecked)
- ❌ DELETE (unchecked)

### HTTP Request

**Method:** POST

**URL:** Paste your Zapier webhook URL

```
https://hooks.zapier.com/hooks/catch/25309342/uztemv4/
```

---

# Step 4: Create Webhook

1. **Click:** "Create webhook"
2. **Webhook is now ACTIVE** ✅

---

# Step 5: Test the Connection

## Insert Test Alert in Supabase

1. **Go to:** SQL Editor
2. **Copy this SQL:**

```sql
INSERT INTO alerts (device_id, message, severity, email, location, time)
VALUES (
  'ESP32_001',
  '🚨 CRITICAL: Flame detected in Building A - Floor 1',
  'critical',
  'ashivamone@gmail.com',
  'Building A - Floor 1',
  NOW()
);
```

3. **Click:** "Run"
4. **Alert is inserted** ✅

---

## Check Zapier Webhook

1. **Go back to Zapier**
2. **Look at:** "Webhooks by Zapier" trigger
3. **You should see:** "1 request received"
4. **Click:** "Test & Continue"

---

# ✅ Verification Checklist

- [ ] Zapier webhook URL copied
- [ ] Supabase webhook created
- [ ] Table set to "alerts"
- [ ] Event set to "INSERT"
- [ ] URL pasted correctly
- [ ] Test alert inserted
- [ ] Zapier received the request
- [ ] Webhook shows data

---

# 🔍 Troubleshooting

### Issue: "No request found"

**Possible causes:**
1. Webhook URL not pasted correctly
2. Alert not inserted yet
3. Wrong table selected

**Fix:**
1. Verify webhook URL is correct
2. Insert test alert again
3. Check table name is "alerts"

### Issue: "Webhook not receiving data"

**Possible causes:**
1. Webhook not enabled
2. Wrong event selected
3. Supabase trigger not firing

**Fix:**
1. Go to Supabase Webhooks
2. Verify webhook is enabled (toggle ON)
3. Verify INSERT is checked
4. Try inserting alert again

---

# 📊 Complete Flow Now

```
┌──────────────────────────────────────────┐
│  Supabase Alert Created                  │
│  INSERT INTO alerts (...)                │
└──────────────┬───────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│  Supabase Webhook Triggers               │
│  (Detects INSERT on alerts table)        │
└──────────────┬───────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│  Sends to Zapier Webhook                 │
│  POST https://hooks.zapier.com/...       │
└──────────────┬───────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│  Zapier Receives Data                    │
│  (Catch Raw Hook trigger)                │
└──────────────┬───────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│  Zapier Code Step Formats Data           │
│  (JavaScript processing)                 │
└──────────────┬───────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│  Zapier Gmail Sends Email                │
│  (HTML template)                         │
└──────────────────────────────────────────┘
```

---

# 🚀 Next Steps

1. ✅ **Zapier webhook created** (you have the URL)
2. ⏳ **Supabase webhook created** (create now using this guide)
3. ⏳ **Test the connection** (insert alert, check Zapier)
4. ⏳ **Complete Zapier Zap** (add Code step, Gmail action)
5. ⏳ **Publish and test** (send real alerts)

---

# 📝 Summary

**What you did:**
- Created Zapier webhook
- Got webhook URL

**What you're doing now:**
- Create Supabase webhook
- Connect to Zapier URL
- Test the connection

**What's next:**
- Complete Zapier Zap setup
- Add Code step
- Add Gmail action
- Publish and test

**Status:** 🟡 In Progress - Create Supabase webhook now!
