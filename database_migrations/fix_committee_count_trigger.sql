-- Fix the trigger function that's causing issues when deleting rows
-- The old function tried to update committees.current_count which doesn't exist
-- We need to update committee_registration_caps.current_count instead

-- First, drop the old broken trigger and function if they exist
DROP TRIGGER IF EXISTS update_committee_on_private_delegate_delete ON private_delegates;
DROP FUNCTION IF EXISTS update_committee_count_from_private_delegate();

-- Create the corrected function that updates the right table
CREATE OR REPLACE FUNCTION update_committee_count_from_private_delegate()
RETURNS TRIGGER AS $$
DECLARE
    committee_name text;
BEGIN
    -- Get the first committee preference from the deleted private delegate
    IF OLD.committee_preferences IS NOT NULL AND array_length(OLD.committee_preferences, 1) > 0 THEN
        committee_name := OLD.committee_preferences[1];
        
        -- Only decrement if the delegate was verified (status = 'verified', not a boolean field)
        IF OLD.status = 'verified' THEN
            -- Update the committee_registration_caps table (correct table)
            UPDATE committee_registration_caps 
            SET current_count = GREATEST(0, current_count - 1),
                updated_at = NOW()
            WHERE committee_registration_caps.committee_name = update_committee_count_from_private_delegate.committee_name;
            
            RAISE NOTICE 'Decremented count for committee: %', committee_name;
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_committee_on_private_delegate_delete
    BEFORE DELETE ON private_delegates
    FOR EACH ROW
    EXECUTE FUNCTION update_committee_count_from_private_delegate();

-- Also check if there are similar triggers on other tables and fix them
-- Fix for delegation_members table if it exists
DROP TRIGGER IF EXISTS update_committee_on_delegation_member_delete ON delegation_members;
DROP FUNCTION IF EXISTS update_committee_count_from_delegation_member();

CREATE OR REPLACE FUNCTION update_committee_count_from_delegation_member()
RETURNS TRIGGER AS $$
BEGIN
    -- Only decrement if the delegate was verified (status = 'verified', not a boolean field)
    IF OLD.status = 'verified' AND OLD.committee_preference IS NOT NULL THEN
        -- Update the committee_registration_caps table (correct table)
        UPDATE committee_registration_caps 
        SET current_count = GREATEST(0, current_count - 1),
            updated_at = NOW()
        WHERE committee_name = OLD.committee_preference;
        
        RAISE NOTICE 'Decremented count for committee: %', OLD.committee_preference;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_committee_on_delegation_member_delete
    BEFORE DELETE ON delegation_members
    FOR EACH ROW
    EXECUTE FUNCTION update_committee_count_from_delegation_member();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ Committee count triggers have been fixed!';
    RAISE NOTICE '  - They now correctly update committee_registration_caps table';
    RAISE NOTICE '  - You should now be able to delete rows from Supabase';
END $$;

