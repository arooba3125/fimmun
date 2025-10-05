-- Check timeline_events table setup and RLS policies

-- 1. Check if table exists and has data
SELECT 
    COUNT(*) as total_events,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_events,
    MIN(created_at) as oldest_event,
    MAX(created_at) as newest_event
FROM timeline_events;

-- 2. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'timeline_events';

-- 3. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'timeline_events';

-- 4. Show sample events with IDs
SELECT id, title, day_number, date, event_type, is_active
FROM timeline_events 
ORDER BY day_number, date
LIMIT 5;
