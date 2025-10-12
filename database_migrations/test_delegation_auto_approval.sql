-- Test Delegation Auto-Approval Features
-- This script tests the new auto-approval functionality

-- 1. Test Data Setup
-- Create a test delegation with head delegate
INSERT INTO delegations (
  delegation_name, 
  delegation_serial, 
  committee_preferences, 
  head_delegate_name, 
  head_delegate_email, 
  head_delegate_whatsapp, 
  head_delegate_institution, 
  status
) VALUES (
  'Test Delegation Auto Approval',
  'DEL-TEST-001',
  '["Pakistan National Assembly"]',
  'Test Head Delegate',
  'test.head@example.com',
  '+1234567890',
  'Test Institution',
  'pending'
) ON CONFLICT (delegation_name) DO NOTHING;

-- Create head delegate as delegation member
INSERT INTO delegation_members (
  delegation_id,
  delegation_serial,
  name,
  email,
  whatsapp,
  institution,
  committee_preference,
  verification_code,
  status
) 
SELECT 
  d.id,
  d.delegation_serial,
  d.head_delegate_name,
  d.head_delegate_email,
  d.head_delegate_whatsapp,
  d.head_delegate_institution,
  d.committee_preferences[1], -- Get first committee preference
  'TEST123',
  'pending'
FROM delegations d 
WHERE d.delegation_name = 'Test Delegation Auto Approval'
ON CONFLICT (email) DO NOTHING;

-- 2. Verify Initial State
SELECT 
  'Initial State Check' as test_step,
  d.delegation_name,
  d.status as delegation_status,
  dm.name as head_delegate_name,
  dm.status as head_delegate_status,
  dm.committee_preference
FROM delegations d
LEFT JOIN delegation_members dm ON d.id = dm.delegation_id AND d.head_delegate_email = dm.email
WHERE d.delegation_name = 'Test Delegation Auto Approval';

-- 3. Check Registration Caps Before
SELECT 
  'Registration Caps Before' as test_step,
  category,
  current_count,
  max_count
FROM registration_caps 
WHERE category = 'delegates'
ORDER BY category;

-- 4. Check Committee Count Before
SELECT 
  'Committee Count Before' as test_step,
  name,
  current_count,
  capacity
FROM committees 
WHERE name = 'Pakistan National Assembly';

-- 5. Test Auto-Approval Logic
-- When head delegate is verified, delegation should be auto-approved
-- When delegation is approved, head delegate should be auto-approved

-- Note: These would be tested through the API endpoints:
-- PUT /api/admin/delegation-members with status: 'verified'
-- PUT /api/admin/delegations with status: 'verified'

-- 6. Cleanup Test Data
-- DELETE FROM delegation_members WHERE delegation_id IN (
--   SELECT id FROM delegations WHERE delegation_name = 'Test Delegation Auto Approval'
-- );
-- DELETE FROM delegations WHERE delegation_name = 'Test Delegation Auto Approval';

COMMENT ON TABLE delegations IS 'Delegations table - when approved, head delegate is auto-approved';
COMMENT ON TABLE delegation_members IS 'Delegation members table - when head delegate approved, delegation is auto-approved';
