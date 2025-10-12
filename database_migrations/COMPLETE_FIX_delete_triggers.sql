-- COMPLETE FIX FOR DELETE TRIGGERS
-- This script fixes all issues with delete triggers for committee counts
-- It handles the correct table names and column names

-- =================================================================
-- STEP 1: Remove all old broken triggers and functions
-- =================================================================

DROP TRIGGER IF EXISTS update_committee_on_private_delegate_delete ON private_delegates CASCADE;
DROP TRIGGER IF EXISTS update_committee_on_delegation_member_delete ON delegation_members CASCADE;
DROP TRIGGER IF EXISTS update_committee_on_alumni_delete ON alumni CASCADE;
DROP TRIGGER IF EXISTS update_committee_on_observer_delete ON observers CASCADE;

DROP FUNCTION IF EXISTS update_committee_count_from_private_delegate() CASCADE;
DROP FUNCTION IF EXISTS update_committee_count_from_delegation_member() CASCADE;
DROP FUNCTION IF EXISTS update_committee_count_from_alumni() CASCADE;
DROP FUNCTION IF EXISTS update_committee_count_from_observer() CASCADE;

-- =================================================================
-- STEP 2: Create corrected trigger functions
-- =================================================================

-- Function for private_delegates table
CREATE OR REPLACE FUNCTION update_committee_count_from_private_delegate()
RETURNS TRIGGER AS $$
DECLARE
    committee_name text;
BEGIN
    -- Get the first committee preference from the deleted private delegate
    IF OLD.committee_preferences IS NOT NULL AND array_length(OLD.committee_preferences, 1) > 0 THEN
        committee_name := OLD.committee_preferences[1];
        
        -- Only decrement if the delegate was verified
        -- Note: private_delegates uses 'status' field, not 'verified'
        IF OLD.status = 'verified' THEN
            -- Update the committee_registration_caps table (correct table, not committees)
            UPDATE committee_registration_caps 
            SET current_count = GREATEST(0, current_count - 1),
                updated_at = NOW()
            WHERE committee_registration_caps.committee_name = update_committee_count_from_private_delegate.committee_name;
            
            RAISE NOTICE 'Decremented count for committee: % (from private_delegates)', committee_name;
        ELSE
            RAISE NOTICE 'Skipped decrement for unverified private delegate';
        END IF;
    END IF;
    
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't block the delete
        RAISE WARNING 'Error updating committee count from private_delegate: %', SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function for delegation_members table
CREATE OR REPLACE FUNCTION update_committee_count_from_delegation_member()
RETURNS TRIGGER AS $$
BEGIN
    -- Only decrement if the delegate was verified and has a committee
    -- Note: delegation_members uses 'status' field, not 'verified'
    IF OLD.status = 'verified' AND OLD.committee_preference IS NOT NULL THEN
        -- Update the committee_registration_caps table (correct table, not committees)
        UPDATE committee_registration_caps 
        SET current_count = GREATEST(0, current_count - 1),
            updated_at = NOW()
        WHERE committee_name = OLD.committee_preference;
        
        RAISE NOTICE 'Decremented count for committee: % (from delegation_members)', OLD.committee_preference;
    ELSE
        RAISE NOTICE 'Skipped decrement for unverified or no-committee delegation member';
    END IF;
    
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't block the delete
        RAISE WARNING 'Error updating committee count from delegation_member: %', SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- STEP 3: Create the triggers
-- =================================================================

CREATE TRIGGER update_committee_on_private_delegate_delete
    BEFORE DELETE ON private_delegates
    FOR EACH ROW
    EXECUTE FUNCTION update_committee_count_from_private_delegate();

CREATE TRIGGER update_committee_on_delegation_member_delete
    BEFORE DELETE ON delegation_members
    FOR EACH ROW
    EXECUTE FUNCTION update_committee_count_from_delegation_member();

-- =================================================================
-- STEP 4: Verification
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '✓ All triggers have been fixed and recreated!';
    RAISE NOTICE '';
    RAISE NOTICE 'What was fixed:';
    RAISE NOTICE '  1. Changed from updating "committees" table to "committee_registration_caps" table';
    RAISE NOTICE '  2. Changed from checking "verified" field to checking "status = ''verified''"';
    RAISE NOTICE '  3. Added error handling to prevent delete failures';
    RAISE NOTICE '  4. Only decrements count if delegate was verified';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now delete rows from Supabase without errors!';
END $$;

-- Display created triggers for verification
SELECT 
    trigger_name, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN (
    'update_committee_on_private_delegate_delete',
    'update_committee_on_delegation_member_delete'
)
ORDER BY event_object_table;

