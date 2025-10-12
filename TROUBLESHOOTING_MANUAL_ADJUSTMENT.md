# Troubleshooting Manual Committee Adjustment

## Issue: "Failed to adjust count" Error

If you're seeing "Failed to adjust count" when trying to manually adjust committee delegate counts, follow these steps:

### Step 1: Check Browser Console

1. Open the admin committee caps page: `/admin/committee-caps`
2. Open browser Developer Tools (F12)
3. Go to the "Console" tab
4. Try clicking the +1 or -1 button
5. Look for error messages in the console

You should see logs like:
```
Sending manual adjustment request: {committeeName: "...", adjustment: 1}
Manual adjustment response: {success: true/false, ...}
```

### Step 2: Check Server Logs

If you're running the development server (`npm run dev`), check the terminal for server logs:

```
Manual adjustment request: { committeeName: '...', adjustment: 1, reason: '...' }
```

Look for any error messages that follow.

### Step 3: Verify Database Connection

Test if the API can connect to the database:

1. Open your browser and go to: `http://localhost:3000/api/admin/debug-committees`
2. You should see a JSON response with all committees

If you get an error, check:
- `.env.local` file has correct Supabase credentials
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Check Committee Names

The most common issue is mismatched committee names. Committee names must match **exactly** (including spaces, capitalization, etc.).

Run the debug endpoint to see exact committee names:
```
GET http://localhost:3000/api/admin/debug-committees
```

Look for:
- Trailing spaces in committee names (`hasTrailingSpace: true`)
- Unexpected characters
- Different capitalization

### Step 5: Test Direct API Call

Test the API directly using curl or Postman:

```bash
curl -X POST http://localhost:3000/api/admin/manual-committee-adjustment \
  -H "Content-Type: application/json" \
  -d '{
    "committeeName": "United Nations Security Council",
    "adjustment": 1,
    "reason": "Test"
  }'
```

### Step 6: Check Database Permissions

Ensure the service role key has permission to update the `committee_registration_caps` table:

```sql
-- Run this in Supabase SQL Editor
SELECT * FROM committee_registration_caps;
```

If this fails, you may need to grant permissions:

```sql
GRANT SELECT, UPDATE ON committee_registration_caps TO service_role;
```

### Step 7: Verify Table Exists

Check if the table exists:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'committee_registration_caps';
```

If the table doesn't exist, run the migration:
```bash
# Execute the SQL in: database_migrations/create_committee_registration_caps.sql
```

### Common Issues & Solutions

#### Issue: "Committee not found"
**Solution:** The committee name doesn't exist in the database. Add it via:
```sql
INSERT INTO committee_registration_caps (committee_name, max_capacity, current_count) 
VALUES ('Committee Name Here', 50, 0);
```

#### Issue: "Failed to fetch committee data"
**Solution:** Database connection issue. Check environment variables.

#### Issue: Network error
**Solution:** The API route isn't accessible. Make sure you're running the dev server and the route exists.

#### Issue: Committee name has trailing space
**Solution:** Clean up the database:
```sql
UPDATE committee_registration_caps 
SET committee_name = TRIM(committee_name);
```

### Getting Help

If the issue persists:

1. Share the output from `/api/admin/debug-committees`
2. Share the browser console logs
3. Share the server terminal logs
4. Share any error messages from the database

### Quick Test

To quickly test if everything is working:

1. Start dev server: `npm run dev`
2. Go to: `http://localhost:3000/admin/committee-caps`
3. Open browser console
4. Click any +1 button
5. Check console for detailed logs

The detailed error message will now show the exact reason for failure.

