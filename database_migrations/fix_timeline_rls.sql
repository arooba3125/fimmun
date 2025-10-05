-- Fix timeline events RLS policy to allow admin operations
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage all timeline events" ON timeline_events;

-- Create a more permissive policy for admin management
-- Since we're using service role key in API, we need to allow all operations
CREATE POLICY "Allow admin operations on timeline events" ON timeline_events
    FOR ALL USING (true);

-- Alternative: If you want to keep RLS but allow service role operations
-- You can use this instead of the above policy:
-- CREATE POLICY "Admins can manage all timeline events" ON timeline_events
--     FOR ALL USING (
--         auth.role() = 'service_role' OR
--         EXISTS (
--             SELECT 1 FROM admin_users
--             WHERE admin_users.id::uuid = auth.uid()
--         )
--     );
