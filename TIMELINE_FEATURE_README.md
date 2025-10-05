# Timeline Feature Implementation

This document describes the implementation of the event timeline feature for the FIMMUN application.

## Overview

The timeline feature allows administrators to manage conference schedules and events, while providing a public interface for delegates to view the conference timeline.

## Database Schema

### Timeline Events Table

```sql
CREATE TABLE timeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  event_type VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Event Types
- `general` - General events
- `ceremony` - Opening/closing ceremonies
- `session` - Committee sessions
- `break` - Breaks and meals

## API Endpoints

### Public Timeline API
- **GET** `/api/timeline/public` - Fetch active timeline events for public display
  - Returns events grouped by day
  - Only returns active events
  - Ordered by day number and start time

### Admin Timeline API
- **GET** `/api/timeline/manage` - Fetch all timeline events (admin only)
- **POST** `/api/timeline/manage` - Create new timeline event (admin only)
- **PUT** `/api/timeline/manage` - Update existing timeline event (admin only)
- **DELETE** `/api/timeline/manage` - Delete timeline event (admin only)

## Frontend Components

### Public Schedule Component
- **File**: `src/components/Schedule.tsx`
- **Features**:
  - Fetches timeline data from public API
  - Displays events grouped by day
  - Shows loading and error states
  - Color-coded event types
  - Responsive design

### Admin Timeline Management
- **File**: `pages/admin/timeline.tsx`
- **Features**:
  - Full CRUD operations for timeline events
  - Statistics dashboard
  - Event filtering and sorting
  - Form validation
  - Modal-based editing

## Setup Instructions

### 1. Database Setup
Run the SQL migration file to create the timeline_events table:

```bash
# Execute the SQL file in your Supabase dashboard or using psql
psql -f database_migrations/timeline_events.sql
```

### 2. Environment Variables
Ensure your environment variables are properly configured in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Row Level Security (RLS)
The migration file includes RLS policies:
- Public read access for active events only
- Admin full access for authenticated admin users

## Usage

### For Administrators
1. Navigate to `/admin/timeline`
2. Click "Add Event" to create new timeline events
3. Edit existing events using the edit button
4. Delete events using the delete button
5. Toggle event active/inactive status

### For Public Users
1. Visit the main website
2. Navigate to the Schedule section
3. View the timeline events organized by day
4. See event details including time, location, and description

## Features

### Event Management
- ✅ Create, read, update, delete events
- ✅ Event type categorization
- ✅ Time and location tracking
- ✅ Active/inactive status
- ✅ Day-based organization

### Public Display
- ✅ Responsive design
- ✅ Color-coded event types
- ✅ Time formatting
- ✅ Loading and error states
- ✅ Empty state handling

### Admin Interface
- ✅ Statistics dashboard
- ✅ Bulk operations
- ✅ Form validation
- ✅ Modal-based editing
- ✅ Search and filter capabilities

## File Structure

```
├── database_migrations/
│   └── timeline_events.sql          # Database schema and sample data
├── pages/
│   ├── api/
│   │   └── timeline/
│   │       ├── manage.ts            # Admin API endpoints
│   │       └── public.ts            # Public API endpoint
│   └── admin/
│       └── timeline.tsx             # Admin management interface
├── src/
│   └── components/
│       └── Schedule.tsx             # Public timeline display
└── lib/
    └── supabaseClient.ts            # TypeScript interfaces
```

## Security Considerations

- Public API only returns active events
- Admin API requires authentication
- RLS policies prevent unauthorized access
- Input validation on all forms
- SQL injection protection through parameterized queries

## Future Enhancements

- Event notifications
- Calendar integration
- Event registration
- Speaker management
- Room booking system
- Mobile app integration
