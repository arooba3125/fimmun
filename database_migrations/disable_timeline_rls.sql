-- Disable RLS on timeline_events table for admin operations
-- This allows the service role to bypass all RLS policies

-- First, drop all existing policies
DROP POLICY IF EXISTS "Public can view active timeline events" ON timeline_events;
DROP POLICY IF EXISTS "Admins can manage all timeline events" ON timeline_events;
DROP POLICY IF EXISTS "Allow admin operations on timeline events" ON timeline_events;

-- Disable RLS entirely for this table
-- This allows the service role (used in API) to perform all operations
ALTER TABLE timeline_events DISABLE ROW LEVEL SECURITY;

-- Alternative approach: Keep RLS enabled but create a policy that allows service role
-- Uncomment the following lines if you want to keep RLS enabled:
-- ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Service role can do everything" ON timeline_events
--     FOR ALL USING (auth.role() = 'service_role');

-- Verify the change
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'timeline_events';
