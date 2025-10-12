-- QUICK FIX: Temporarily disable the problematic trigger so you can delete rows
-- Run this if you need to delete rows immediately and will fix the trigger properly later

-- Disable the trigger on private_delegates
DROP TRIGGER IF EXISTS update_committee_on_private_delegate_delete ON private_delegates CASCADE;

-- Disable the trigger on delegation_members
DROP TRIGGER IF EXISTS update_committee_on_delegation_member_delete ON delegation_members CASCADE;

-- Drop the broken functions
DROP FUNCTION IF EXISTS update_committee_count_from_private_delegate() CASCADE;
DROP FUNCTION IF EXISTS update_committee_count_from_delegation_member() CASCADE;

-- Success message
SELECT '✓ Problematic triggers have been removed. You can now delete rows from Supabase.' as status;
SELECT '⚠ Note: After deleting, run fix_committee_count_trigger.sql to restore proper triggers.' as warning;

