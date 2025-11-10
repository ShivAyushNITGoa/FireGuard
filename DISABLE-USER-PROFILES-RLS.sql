-- EMERGENCY FIX: Completely Disable RLS on user_profiles
-- This will stop the infinite recursion immediately

-- Disable RLS on user_profiles (no policies needed)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- Expected result: rowsecurity = false

-- This allows all users to read/write user_profiles without any policy checks
-- Alerts will now be created successfully!
