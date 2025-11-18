-- Find Your User ID
-- Run this to get your actual user ID from Supabase Auth

SELECT 'Your User Profiles:' AS info;
SELECT id, email, full_name, receive_alerts FROM user_profiles;

SELECT '' AS blank;
SELECT 'Copy your user ID (the UUID in the id column) and use it in the next query.' AS instruction;
