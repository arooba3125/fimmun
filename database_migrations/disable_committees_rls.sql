-- Disable RLS on committees table for admin operations
-- This allows the service role to bypass all RLS policies

-- First, drop all existing policies
DROP POLICY IF EXISTS "Public can view committees" ON committees;
DROP POLICY IF EXISTS "Admins can manage committees" ON committees;
DROP POLICY IF EXISTS "Allow admin operations on committees" ON committees;

-- Disable RLS entirely for this table
-- This allows the service role (used in API) to perform all operations
ALTER TABLE committees DISABLE ROW LEVEL SECURITY;

-- Verify the change
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'committees';