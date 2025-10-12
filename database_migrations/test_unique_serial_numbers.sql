-- Test Unique Serial Number System
-- This script tests the new centralized serial number generation system

-- Test the serial number generation function
SELECT 
  'Testing Serial Number Generation:' as message;

-- Test OD (Delegates) serial numbers
SELECT 
  'OD (Delegates) - Next available:' as test_type,
  generate_unique_serial_number('OD') as next_serial;

-- Test OO (Observers) serial numbers  
SELECT 
  'OO (Observers) - Next available:' as test_type,
  generate_unique_serial_number('OO') as next_serial;

-- Test OA (Alumni) serial numbers
SELECT 
  'OA (Alumni) - Next available:' as test_type,
  generate_unique_serial_number('OA') as next_serial;

-- Show current highest serial numbers in each category
WITH serial_analysis AS (
  SELECT 
    'OD' as category,
    MAX(CAST(SPLIT_PART(serial_number, '-', 2) AS INTEGER)) as max_number,
    COUNT(*) as total_count
  FROM (
    SELECT serial_number FROM private_delegates WHERE serial_number LIKE 'OD-%'
    UNION ALL
    SELECT serial_number FROM delegation_members WHERE serial_number LIKE 'OD-%'
  ) od_serials
  
  UNION ALL
  
  SELECT 
    'OO' as category,
    MAX(CAST(SPLIT_PART(serial_number, '-', 2) AS INTEGER)) as max_number,
    COUNT(*) as total_count
  FROM observers WHERE serial_number LIKE 'OO-%'
  
  UNION ALL
  
  SELECT 
    'OA' as category,
    MAX(CAST(SPLIT_PART(serial_number, '-', 2) AS INTEGER)) as max_number,
    COUNT(*) as total_count
  FROM alumni WHERE serial_number LIKE 'OA-%'
)
SELECT 
  'Current Serial Number Status:' as message,
  category,
  max_number,
  total_count,
  CASE 
    WHEN max_number IS NULL THEN category || '-001'
    ELSE category || '-' || LPAD((max_number + 1)::TEXT, 3, '0')
  END as next_available
FROM serial_analysis
ORDER BY category;

-- Verify no duplicates exist
SELECT 
  'Duplicate Check - Should return empty if no duplicates:' as message;

WITH all_serial_numbers AS (
  SELECT 'private_delegates' as table_name, serial_number FROM private_delegates WHERE serial_number IS NOT NULL
  UNION ALL
  SELECT 'observers' as table_name, serial_number FROM observers WHERE serial_number IS NOT NULL
  UNION ALL
  SELECT 'alumni' as table_name, serial_number FROM alumni WHERE serial_number IS NOT NULL
  UNION ALL
  SELECT 'delegation_members' as table_name, serial_number FROM delegation_members WHERE serial_number IS NOT NULL
)
SELECT 
  serial_number,
  STRING_AGG(table_name, ', ') as found_in_tables,
  COUNT(*) as duplicate_count
FROM all_serial_numbers
GROUP BY serial_number
HAVING COUNT(*) > 1
ORDER BY serial_number;

-- Show sample of existing serial numbers for verification
SELECT 
  'Sample of Existing Serial Numbers:' as message;

SELECT 
  'Private Delegates:' as source,
  serial_number,
  created_at
FROM private_delegates 
WHERE serial_number IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

SELECT 
  'Observers:' as source,
  serial_number,
  created_at
FROM observers 
WHERE serial_number IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

SELECT 
  'Alumni:' as source,
  serial_number,
  created_at
FROM alumni 
WHERE serial_number IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

SELECT 
  'Delegation Members:' as source,
  serial_number,
  created_at
FROM delegation_members 
WHERE serial_number IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

COMMENT ON FUNCTION generate_unique_serial_number(TEXT) IS 'Test function for unique serial number generation across all registration tables';
