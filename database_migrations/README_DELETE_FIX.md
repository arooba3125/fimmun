# Database Trigger Fix for Delete Operations

## 🚨 Problem Summary

When trying to delete rows from `private_delegates` or `delegation_members` tables in Supabase, you get errors:
- ❌ `column "current_count" does not exist` in committees table
- ❌ `record "old" has no field "verified"`

## ✅ Quick Solution

### Choose the RIGHT file for your situation:

| File | When to Use | What It Does |
|------|-------------|--------------|
| **COMPLETE_FIX_delete_triggers.sql** | ⭐ **USE THIS** - Best option | Fixes everything, includes error handling |
| fix_committee_count_trigger.sql | Same as above | Alternative with same fixes |
| QUICK_FIX_delete_issue.sql | Emergency only | Just removes triggers (temporary) |

## 🎯 Recommended: Run This One

**File:** `COMPLETE_FIX_delete_triggers.sql`

### Steps:
1. Copy the entire file content
2. Open Supabase → SQL Editor
3. Paste and click "Run"
4. Done! ✅

### What Gets Fixed:
- ✅ Updates correct table: `committee_registration_caps` (not `committees`)
- ✅ Checks correct field: `status = 'verified'` (not `verified` boolean)
- ✅ Adds error handling so deletes never fail
- ✅ Only decrements verified delegates
- ✅ Prevents negative counts

## 🔧 What Was Wrong

### Before (Broken):
```sql
UPDATE committees 
SET current_count = ...
WHERE ...
IF OLD.verified = true  -- ❌ Field doesn't exist
```

### After (Fixed):
```sql
UPDATE committee_registration_caps  -- ✅ Correct table
SET current_count = ...
WHERE ...
IF OLD.status = 'verified'  -- ✅ Correct field
```

## 📋 Files in This Directory

1. **COMPLETE_FIX_delete_triggers.sql** ⭐ RECOMMENDED
   - Complete fix with error handling
   - Works for all cases
   - Shows verification results

2. **fix_committee_count_trigger.sql** 
   - Same functionality as above
   - Alternative if you prefer this one

3. **QUICK_FIX_delete_issue.sql**
   - Emergency use only
   - Removes triggers temporarily
   - Run proper fix after using this

4. **HOW_TO_FIX_DELETE_ERROR.md**
   - Detailed troubleshooting guide
   - Step-by-step instructions
   - Common issues and solutions

## ✨ After Running the Fix

You can now:
- ✅ Delete rows from Supabase table editor
- ✅ Delete rows programmatically via API
- ✅ Committee counts automatically decrement (only for verified delegates)
- ✅ Counts never go below 0
- ✅ Deletes never fail due to trigger errors

## 🧪 Test It

After running the fix, test by:
1. Go to Supabase → Table Editor → private_delegates
2. Try deleting a row
3. Should work without errors! ✅

## 📞 Still Having Issues?

See `HOW_TO_FIX_DELETE_ERROR.md` for detailed troubleshooting.

## 🎉 Summary

**Just run `COMPLETE_FIX_delete_triggers.sql` in Supabase SQL Editor and you're done!**

