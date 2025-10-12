# FIMMUN Ticket & Serial Number System

## Overview
This document explains the new ticket generation system and the improved serial number generation mechanism that prevents duplicate IDs.

## 1. Serial Number Generation System

### Problem Fixed
Previously, when admin verified multiple delegates quickly (fast clicking), the same serial number (e.g., OD-001) could be assigned to multiple delegates due to race conditions in the database queries.

### Solution
We implemented an **atomic counter system** using a PostgreSQL function that guarantees unique serial numbers even with concurrent requests.

### How It Works
1. A new table `serial_numbers_counter` tracks the current count for each category (OD, OO, OA)
2. A database function `get_next_serial_number(category)` atomically increments and returns the next number
3. The function uses row-level locking to prevent race conditions
4. Even if 10 admins verify delegates simultaneously, each will get a unique serial number

### Setup Instructions
Run this SQL migration in your Supabase SQL Editor:
```sql
-- File: database_migrations/create_serial_numbers_counter.sql
-- This creates the counter table and the atomic function
```

### Serial Number Categories
- `OD` - Delegates (Private Delegates & Delegation Members)
- `OO` - Observers
- `OA` - Alumni

### Fallback System
If the database function fails for any reason, the system has a two-level fallback:
1. Manual query of existing serial numbers to find the highest number
2. Timestamp-based generation as last resort

## 2. Ticket Generation System

### Features
The ticket system provides professional, printable tickets for all verified participants.

### Ticket Information
Each ticket includes:
- **Participant Name** - Full name of the registered participant
- **Serial Number** - Unique identifier (e.g., OD-001, OO-025)
- **Registration Type** - Private Delegate, Delegation Member, Observer, or Alumni
- **Committee** - Assigned committee or session access
- **Event** - FIMMUN 2025
- **Date** - Event date (configurable)
- **Location** - Forman Christian College, Lahore
- **FIMMUN Logo** - Official branding
- **QR Code Placeholder** - For future scanning implementation
- **Instructions** - Important participant guidelines

### How to Access Tickets

#### For Participants
After verification by admin, participants can access their ticket at:
```
/ticket/[id]?type=[registration-type]
```

Examples:
- Private Delegate: `/ticket/abc123?type=private-delegate`
- Delegation Member: `/ticket/def456?type=delegation-member`
- Observer: `/ticket/ghi789?type=observer`
- Alumni: `/ticket/jkl012?type=alumni`

#### For Admins
Admins should share the ticket URL with verified participants via email or the verification confirmation.

### Ticket Features
- **Print-friendly** - Optimized for printing
- **PDF Download** - Uses browser's "Save as PDF" function
- **Responsive Design** - Works on mobile and desktop
- **Professional Layout** - Clean, modern design with branding
- **Secure** - Only shows tickets for verified participants

### API Endpoint
`GET /api/tickets/generate?id=[id]&type=[type]`

Returns ticket data in JSON format for verified participants only.

### Customization
To update event details (date, location), edit:
- `pages/api/tickets/generate.ts` - Update the default values in the ticketData object

## 3. Logo Integration

The FIMMUN logo (`public/logo.png`) has been integrated throughout the application:

### Website Integration
- **Navigation Bar** - Top-left corner with organization name
- **Hero Section** - Large logo in the main banner
- **Footer** - Logo with organization details

### Ticket Integration
- **Ticket Header** - Logo appears in the ticket's branded header
- **Professional Branding** - Consistent visual identity

## 4. Usage Instructions

### For Admins - Verifying Participants

1. Navigate to the appropriate admin panel:
   - `/admin/private-delegates`
   - `/admin/delegation-members`
   - `/admin/observers`
   - `/admin/alumni`

2. Click "Verify" on a pending registration

3. The system automatically:
   - Generates a unique serial number (no duplicates!)
   - Updates the participant's status to "verified"
   - Increments the committee registration count (if applicable)

4. Share the ticket URL with the participant:
   ```
   https://your-domain.com/ticket/[participant-id]?type=[registration-type]
   ```

### For Participants - Accessing Tickets

1. Receive ticket URL from admin after verification
2. Open the URL in a browser
3. View ticket with all details
4. Options:
   - **Print** - Print a physical copy
   - **Download PDF** - Save as PDF for mobile access
   - **Screenshot** - Take a screenshot for quick access

### Important Notes

- Tickets are only generated for **verified** participants
- Serial numbers are assigned during verification (not during registration)
- Each serial number is globally unique across all registration types
- Tickets should be presented at the event entrance
- Participants should bring valid ID for verification

## 5. Technical Details

### Files Created/Modified

**New Files:**
- `database_migrations/create_serial_numbers_counter.sql` - Serial number counter table
- `pages/api/tickets/generate.ts` - Ticket generation API
- `pages/ticket/[id].tsx` - Ticket viewer page
- `TICKET_SYSTEM_README.md` - This documentation

**Modified Files:**
- `lib/serialNumberUtils.ts` - Updated to use atomic serial number generation
- `src/components/Navigation.tsx` - Added logo
- `src/components/Hero.tsx` - Added logo
- `src/components/Footer.tsx` - Added logo

### Database Tables
- `serial_numbers_counter` - Tracks current count for each category
- Uses PostgreSQL row-level locking for atomicity

### Testing Recommendations

1. **Test Serial Number Uniqueness:**
   - Open multiple admin panels in different browsers
   - Verify multiple delegates simultaneously
   - Confirm all receive unique serial numbers

2. **Test Ticket Generation:**
   - Verify a participant
   - Access their ticket URL
   - Confirm all details are correct
   - Test print functionality

3. **Test Edge Cases:**
   - Try accessing ticket before verification (should fail)
   - Try accessing with invalid ID (should show error)
   - Test with different registration types

## Support

For issues or questions about the ticket system, contact the development team.

