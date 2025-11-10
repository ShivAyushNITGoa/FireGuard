-- Authentication & Email Alerts Setup
-- Run this in Supabase SQL Editor

-- ==================== STEP 1: USER PROFILES TABLE ====================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'user', -- 'admin' or 'user'
  receive_alerts BOOLEAN DEFAULT true,
  alert_email TEXT, -- Can be different from login email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_receive_alerts ON user_profiles(receive_alerts);

SELECT '✅ Step 1: User profiles table created' AS status;

-- ==================== STEP 2: ALERT SUBSCRIPTIONS TABLE ====================
CREATE TABLE IF NOT EXISTS alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  min_severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Enable RLS
ALTER TABLE alert_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON alert_subscriptions;

-- Policy: Users can manage their own subscriptions
CREATE POLICY "Users can manage own subscriptions" ON alert_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_user ON alert_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_device ON alert_subscriptions(device_id);

SELECT '✅ Step 2: Alert subscriptions table created' AS status;

-- ==================== STEP 3: EMAIL NOTIFICATION FUNCTION ====================
-- Function to send email notifications (requires external email service)
CREATE OR REPLACE FUNCTION notify_users_on_alert()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  severity_priority INTEGER;
BEGIN
  -- Map severity to priority
  severity_priority := CASE NEW.severity
    WHEN 'critical' THEN 4
    WHEN 'high' THEN 3
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 1
    ELSE 0
  END;
  
  -- Loop through subscribed users
  FOR user_record IN
    SELECT 
      up.id,
      up.email,
      up.alert_email,
      up.full_name,
      asub.min_severity
    FROM alert_subscriptions asub
    JOIN user_profiles up ON asub.user_id = up.id
    WHERE asub.device_id = NEW.device_id
      AND asub.email_enabled = true
      AND up.receive_alerts = true
      AND severity_priority >= CASE asub.min_severity
        WHEN 'critical' THEN 4
        WHEN 'high' THEN 3
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 1
        ELSE 0
      END
  LOOP
    -- Send notification via pg_notify
    -- This will be picked up by your Edge Function or external service
    PERFORM pg_notify(
      'alert_email',
      json_build_object(
        'user_id', user_record.id,
        'email', COALESCE(user_record.alert_email, user_record.email),
        'name', user_record.full_name,
        'alert_id', NEW.id,
        'message', NEW.message,
        'severity', NEW.severity,
        'device_id', NEW.device_id,
        'location', NEW.location,
        'gas', NEW.gas,
        'temp', NEW.temp,
        'humidity', NEW.humidity,
        'flame', NEW.flame,
        'time', NEW.time
      )::text
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on new alerts
DROP TRIGGER IF EXISTS on_alert_created ON alerts;
CREATE TRIGGER on_alert_created
  AFTER INSERT ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_on_alert();

SELECT '✅ Step 3: Email notification function created' AS status;

-- ==================== STEP 4: CREATE ADMIN USER (OPTIONAL) ====================
-- This will create an admin user profile for the first registered user
-- You can manually update this after creating your first account

-- Example: Update first user to admin (run after creating your account)
-- UPDATE user_profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

SELECT '✅ Step 4: Ready to create admin user (update manually after signup)' AS status;

-- ==================== VERIFICATION ====================
-- Check tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'alert_subscriptions')
ORDER BY table_name;

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'alert_subscriptions');

-- ==================== SUCCESS MESSAGE ====================
SELECT '🎉 Authentication & Email Setup Complete!' AS result;
SELECT '' AS blank;
SELECT '📋 NEXT STEPS:' AS next_steps;
SELECT '1. Enable Email provider in Supabase Dashboard → Authentication → Providers' AS step_1;
SELECT '2. Install npm packages: npm install @supabase/auth-helpers-nextjs' AS step_2;
SELECT '3. Create auth files (see AUTH-AND-EMAIL-SETUP.md)' AS step_3;
SELECT '4. Set up email service (Resend, SendGrid, or Supabase Edge Function)' AS step_4;
SELECT '5. Test signup/login flow' AS step_5;
SELECT '6. Subscribe to device alerts and test email notifications' AS step_6;
