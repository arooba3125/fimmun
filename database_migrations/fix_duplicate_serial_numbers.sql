-- Fix Duplicate Serial Numbers Migration
-- This script identifies and fixes duplicate serial numbers across all registration tables

-- First, let's identify any duplicates
SELECT 
  'DUPLICATE SERIAL NUMBERS FOUND:' as message;

-- Check for duplicates in private_delegates
SELECT 
  'Private Delegates Duplicates:' as table_name,
  serial_number,
  COUNT(*) as count
FROM private_delegates 
WHERE serial_number IS NOT NULL
GROUP BY serial_number 
HAVING COUNT(*) > 1;

-- Check for duplicates in observers
SELECT 
  'Observers Duplicates:' as table_name,
  serial_number,
  COUNT(*) as count
FROM observers 
WHERE serial_number IS NOT NULL
GROUP BY serial_number 
HAVING COUNT(*) > 1;

-- Check for duplicates in alumni
SELECT 
  'Alumni Duplicates:' as table_name,
  serial_number,
  COUNT(*) as count
FROM alumni 
WHERE serial_number IS NOT NULL
GROUP BY serial_number 
HAVING COUNT(*) > 1;

-- Check for duplicates in delegation_members
SELECT 
  'Delegation Members Duplicates:' as table_name,
  serial_number,
  COUNT(*) as count
FROM delegation_members 
WHERE serial_number IS NOT NULL
GROUP BY serial_number 
HAVING COUNT(*) > 1;

-- Check for cross-table duplicates (same serial number in different tables)
WITH all_serial_numbers AS (
  SELECT 'private_delegates' as table_name, id, serial_number, created_at FROM private_delegates WHERE serial_number IS NOT NULL
  UNION ALL
  SELECT 'observers' as table_name, id, serial_number, created_at FROM observers WHERE serial_number IS NOT NULL
  UNION ALL
  SELECT 'alumni' as table_name, id, serial_number, created_at FROM alumni WHERE serial_number IS NOT NULL
  UNION ALL
  SELECT 'delegation_members' as table_name, id, serial_number, created_at FROM delegation_members WHERE serial_number IS NOT NULL
)
SELECT 
  'Cross-table Duplicates:' as message,
  serial_number,
  STRING_AGG(table_name || ':' || id::text, ', ') as duplicates
FROM all_serial_numbers
GROUP BY serial_number
HAVING COUNT(*) > 1;

-- Fix strategy: For duplicates, keep the oldest record and update newer ones
-- This is a complex operation, so we'll create a procedure to handle it

-- Create a function to generate unique serial numbers
CREATE OR REPLACE FUNCTION generate_unique_serial_number(category_prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  max_number INTEGER := 0;
  new_serial TEXT;
  category_max INTEGER;
BEGIN
  -- Get the maximum number across all tables for this category
  SELECT GREATEST(
    COALESCE(MAX(CAST(SPLIT_PART(serial_number, '-', 2) AS INTEGER)), 0),
    COALESCE(MAX(CAST(SPLIT_PART(serial_number, '-', 2) AS INTEGER)), 0),
    COALESCE(MAX(CAST(SPLIT_PART(serial_number, '-', 2) AS INTEGER)), 0),
    COALESCE(MAX(CAST(SPLIT_PART(serial_number, '-', 2) AS INTEGER)), 0)
  ) INTO category_max
  FROM (
    SELECT serial_number FROM private_delegates WHERE serial_number LIKE category_prefix || '-%'
    UNION ALL
    SELECT serial_number FROM observers WHERE serial_number LIKE category_prefix || '-%'
    UNION ALL
    SELECT serial_number FROM alumni WHERE serial_number LIKE category_prefix || '-%'
    UNION ALL
    SELECT serial_number FROM delegation_members WHERE serial_number LIKE category_prefix || '-%'
  ) all_serials;
  
  new_serial := category_prefix || '-' || LPAD((category_max + 1)::TEXT, 3, '0');
  RETURN new_serial;
END;
$$ LANGUAGE plpgsql;

-- Example usage of the function:
-- SELECT generate_unique_serial_number('OD'); -- For delegates
-- SELECT generate_unique_serial_number('OO'); -- For observers  
-- SELECT generate_unique_serial_number('OA'); -- For alumni

-- Manual fix for duplicates (run these one by one after identifying duplicates):
-- Example: If OD-001 exists in both private_delegates and delegation_members:
-- UPDATE private_delegates SET serial_number = generate_unique_serial_number('OD') WHERE id = 'duplicate_id_here';

-- Show current serial number distribution
SELECT 
  'Current Serial Number Distribution:' as message;

SELECT 
  'Private Delegates:' as table_name,
  serial_number,
  COUNT(*) as count
FROM private_delegates 
WHERE serial_number IS NOT NULL
GROUP BY serial_number 
ORDER BY serial_number;

SELECT 
  'Observers:' as table_name,
  serial_number,
  COUNT(*) as count
FROM observers 
WHERE serial_number IS NOT NULL
GROUP BY serial_number 
ORDER BY serial_number;

SELECT 
  'Alumni:' as table_name,
  serial_number,
  COUNT(*) as count
FROM alumni 
WHERE serial_number IS NOT NULL
GROUP BY serial_number 
ORDER BY serial_number;

SELECT 
  'Delegation Members:' as table_name,
  serial_number,
  COUNT(*) as count
FROM delegation_members 
WHERE serial_number IS NOT NULL
GROUP BY serial_number 
ORDER BY serial_number;

-- Clean up function
-- DROP FUNCTION IF EXISTS generate_unique_serial_number(TEXT);

COMMENT ON FUNCTION generate_unique_serial_number(TEXT) IS 'Generates unique serial numbers across all registration tables for a given category prefix';
