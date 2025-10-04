# FIMMUN 2025 - Complete Implementation Guide

## Overview
FIMMUN (Fazaia Inter College Minhas Model United Nations) is a comprehensive MUN registration and management system with 4 registration categories and a complete admin panel.

## System Architecture

### Frontend Structure
- **Home Page**: Basic MUN information and FIMMUN introduction
- **About Us**: Committee information, location, previous MUN info, legacy
- **Registration**: 4-category registration system
- **Status Checker**: Public page for registrants to check their status

### Backend Structure
- **Admin Panel**: 4 separate pages for managing each registration category
- **Database**: Supabase with 8 main tables
- **API Routes**: RESTful endpoints for all operations

## Database Schema

### 1. Registration Tables

#### `private_delegates`
```sql
CREATE TABLE private_delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  mun_experience TEXT,
  committee_preferences TEXT[], -- Array of committee preferences
  payment_proof_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
  serial_number VARCHAR(10), -- OD-001 format
  verification_code VARCHAR(10), -- For status checking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `observers`
```sql
CREATE TABLE observers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  mun_experience TEXT,
  payment_proof_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending',
  serial_number VARCHAR(10), -- OO-001 format
  verification_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `alumni`
```sql
CREATE TABLE alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  batch VARCHAR(20) NOT NULL, -- e.g., 2020-2024
  payment_proof_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending',
  serial_number VARCHAR(10), -- OA-001 format
  verification_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `delegations`
```sql
CREATE TABLE delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_name VARCHAR(255) NOT NULL,
  delegation_serial VARCHAR(20) UNIQUE NOT NULL, -- DEL-001 format
  committee_preferences TEXT[],
  head_delegate_name VARCHAR(255) NOT NULL,
  head_delegate_email VARCHAR(255) NOT NULL,
  head_delegate_whatsapp VARCHAR(20) NOT NULL,
  head_delegate_institution VARCHAR(255) NOT NULL,
  head_delegate_experience TEXT,
  payment_proof_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `delegation_members`
```sql
CREATE TABLE delegation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_id UUID REFERENCES delegations(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  mun_experience TEXT,
  payment_proof_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending',
  serial_number VARCHAR(10), -- OD-001 format
  verification_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Management Tables

#### `committees` (Updated)
```sql
CREATE TABLE committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  topic TEXT,
  description TEXT,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  max_delegates INTEGER NOT NULL,
  current_delegates INTEGER DEFAULT 0,
  chair_name VARCHAR(255),
  chair_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert committee data
INSERT INTO committees (name, short_name, max_delegates) VALUES
('Pakistan National Assembly', 'PNA', 100),
('Special Crisis Committee', 'Crisis', 40),
('United Nations Security Council', 'UNSC', 40),
('United Nations Human Rights Council', 'UNHRC', 40),
('Disarmament and International Security Committee', 'UNDISEC', 35),
('Commission on the Status of Women', 'UNSCW', 35),
('Organization of Islamic Cooperation', 'OIC', 35);
```

#### `registration_caps`
```sql
CREATE TABLE registration_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL, -- 'delegates', 'observers', 'alumni'
  current_count INTEGER DEFAULT 0,
  max_count INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert cap data
INSERT INTO registration_caps (category, max_count) VALUES
('delegates', 350),
('observers', 150),
('alumni', 100); -- Estimated cap
```

#### `admin_users` (Existing - Updated)
```sql
-- Keep existing admin_users table structure
-- Add new fields if needed for enhanced admin functionality
```

## API Endpoints

### Registration Endpoints

#### POST `/api/registrations/private-delegate`
```typescript
{
  name: string;
  email: string;
  whatsapp: string;
  institution: string;
  mun_experience?: string;
  committee_preferences: string[];
  payment_proof_url: string;
}
```

#### POST `/api/registrations/observer`
```typescript
{
  name: string;
  email: string;
  whatsapp: string;
  institution: string;
  mun_experience?: string;
  payment_proof_url: string;
}
```

#### POST `/api/registrations/alumni`
```typescript
{
  name: string;
  email: string;
  whatsapp: string;
  batch: string;
  payment_proof_url: string;
}
```

#### POST `/api/registrations/delegation`
```typescript
{
  delegation_name: string;
  committee_preferences: string[];
  head_delegate_name: string;
  head_delegate_email: string;
  head_delegate_whatsapp: string;
  head_delegate_institution: string;
  head_delegate_experience?: string;
  payment_proof_url: string;
}
```

#### POST `/api/registrations/delegation-member`
```typescript
{
  delegation_serial: string;
  name: string;
  email: string;
  whatsapp: string;
  institution: string;
  mun_experience?: string;
  payment_proof_url: string;
}
```

### Admin Management Endpoints

#### GET `/api/admin/private-delegates`
#### PUT `/api/admin/private-delegates/:id`
#### DELETE `/api/admin/private-delegates/:id`

#### GET `/api/admin/observers`
#### PUT `/api/admin/observers/:id`
#### DELETE `/api/admin/observers/:id`

#### GET `/api/admin/alumni`
#### PUT `/api/admin/alumni/:id`
#### DELETE `/api/admin/alumni/:id`

#### GET `/api/admin/delegations`
#### PUT `/api/admin/delegations/:id`
#### DELETE `/api/admin/delegations/:id`

#### GET `/api/admin/delegation-members`
#### PUT `/api/admin/delegation-members/:id`
#### DELETE `/api/admin/delegation-members/:id`

### Status Checker Endpoint

#### GET `/api/status/:verification_code`
Returns registration status and serial number if verified.

### Dashboard Endpoints

#### GET `/api/dashboard/stats`
Returns registration counts and statistics.

#### PUT `/api/dashboard/caps`
Updates registration caps.

## Frontend Implementation

### 1. Registration Forms

#### Private Delegate Registration
- Name, Email, WhatsApp, Institution fields
- MUN Experience textarea
- Committee preferences (multiple select)
- File upload for payment proof
- Form validation and submission

#### Observer Registration
- Same as Private Delegate but without committee preferences

#### Alumni Registration
- Name, Email, WhatsApp, Batch fields
- Important note about 2nd day attendance
- File upload for payment proof

#### Delegation Registration
- Two-step process:
  1. Register delegation (head delegate info)
  2. Register delegation members (using delegation serial)

### 2. Admin Panel Structure

#### Admin Dashboard
- Overview statistics
- Quick actions
- Recent registrations

#### Private Delegates Management
- List all private delegates
- Filter by status
- Approve/reject registrations
- Generate serial numbers
- Export data

#### Observers Management
- List all observers
- Filter by status
- Approve/reject registrations
- Generate serial numbers

#### Alumni Management
- List all alumni
- Filter by status
- Approve/reject registrations
- Generate serial numbers

#### Delegations Management
- List all delegations
- View delegation members
- Manage delegation status
- Generate member serial numbers

### 3. Status Checker
- Simple form with verification code input
- Display registration status
- Show serial number if verified
- Download MUN ticket

### 4. Home Page Updates
- Dynamic registration count display
- Committee information
- Registration caps display

## Implementation Status

### ✅ Completed Components

#### Database Schema
- All registration tables designed and implemented
- Committee management system
- Registration caps system
- Admin user management

#### API Endpoints
- ✅ Registration endpoints for all 4 categories
- ✅ Admin management endpoints for all registration types
- ✅ Status checker endpoint
- ✅ Dashboard statistics endpoint
- ✅ Registration caps management

#### Frontend Components
- ✅ Admin dashboard with real-time statistics
- ✅ Private delegates management page
- ✅ Status checker page with MUN ticket generation
- ✅ Authentication system
- ✅ Committee management

#### Core Features
- ✅ 4-category registration system
- ✅ Verification code generation
- ✅ Serial number generation (OD-001, OO-001, OA-001, DEL-001)
- ✅ Status tracking (pending, verified, rejected)
- ✅ Registration caps enforcement
- ✅ Payment proof upload handling
- ✅ MUN ticket generation and download

### 🔄 Remaining Implementation

#### Frontend Forms (To be created)
1. **Private Delegate Registration Form**
   - Name, Email, WhatsApp, Institution
   - MUN Experience textarea
   - Committee preferences (multiple select)
   - File upload for payment proof

2. **Observer Registration Form**
   - Same as Private Delegate but without committee preferences

3. **Alumni Registration Form**
   - Name, Email, WhatsApp, Batch
   - Important note about 2nd day attendance
   - File upload for payment proof

4. **Delegation Registration Forms**
   - Two-step process: Register delegation → Register members
   - Head delegate information
   - Delegation member registration with serial number

5. **Additional Admin Pages**
   - Observers management page
   - Alumni management page
   - Delegations management page

#### Database Setup (Required)
1. Create all tables in Supabase using the provided SQL schema
2. Insert committee data with proper caps
3. Set up registration caps
4. Configure Row Level Security policies
5. Set up file storage for payment proofs

## Backend Implementation Guide

### Database Setup in Supabase

#### 1. Create All Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Private Delegates Table
CREATE TABLE private_delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  mun_experience TEXT,
  committee_preferences TEXT[],
  payment_proof_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  serial_number VARCHAR(10),
  verification_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Observers Table
CREATE TABLE observers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  mun_experience TEXT,
  payment_proof_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  serial_number VARCHAR(10),
  verification_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Alumni Table
CREATE TABLE alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  batch VARCHAR(20) NOT NULL,
  payment_proof_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  serial_number VARCHAR(10),
  verification_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delegations Table
CREATE TABLE delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_name VARCHAR(255) NOT NULL,
  delegation_serial VARCHAR(20) UNIQUE NOT NULL,
  committee_preferences TEXT[],
  head_delegate_name VARCHAR(255) NOT NULL,
  head_delegate_email VARCHAR(255) NOT NULL,
  head_delegate_whatsapp VARCHAR(20) NOT NULL,
  head_delegate_institution VARCHAR(255) NOT NULL,
  head_delegate_experience TEXT,
  payment_proof_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Delegation Members Table
CREATE TABLE delegation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_id UUID REFERENCES delegations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  mun_experience TEXT,
  payment_proof_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  serial_number VARCHAR(10),
  verification_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Committees Table (Updated)
CREATE TABLE committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  topic TEXT,
  description TEXT,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  max_delegates INTEGER NOT NULL,
  current_delegates INTEGER DEFAULT 0,
  chair_name VARCHAR(255),
  chair_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Registration Caps Table
CREATE TABLE registration_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL CHECK (category IN ('delegates', 'observers', 'alumni')),
  current_count INTEGER DEFAULT 0,
  max_count INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin Users Table (Keep existing)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Insert Initial Data

```sql
-- Insert Committee Data
INSERT INTO committees (name, short_name, max_delegates, difficulty_level) VALUES
('Pakistan National Assembly', 'PNA', 100, 'intermediate'),
('Special Crisis Committee', 'Crisis', 40, 'advanced'),
('United Nations Security Council', 'UNSC', 40, 'advanced'),
('United Nations Human Rights Council', 'UNHRC', 40, 'intermediate'),
('Disarmament and International Security Committee', 'UNDISEC', 35, 'intermediate'),
('Commission on the Status of Women', 'UNSCW', 35, 'beginner'),
('Organization of Islamic Cooperation', 'OIC', 35, 'intermediate');

-- Insert Registration Caps
INSERT INTO registration_caps (category, max_count) VALUES
('delegates', 350),
('observers', 150),
('alumni', 100);
```

#### 3. Set Up Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE private_delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE observers ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to committees
CREATE POLICY "Public can view committees" ON committees
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view registration caps" ON registration_caps
  FOR SELECT USING (true);

-- Create policies for admin access (service role bypasses RLS)
-- These are handled by the service role key in the API
```

#### 4. Set Up File Storage

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `payment-proofs`
3. Set it to **Private**
4. Configure policies:

```sql
-- Allow users to upload payment proofs
CREATE POLICY "Users can upload payment proofs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');

-- Allow admins to view payment proofs
CREATE POLICY "Admins can view payment proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs');
```

### Environment Variables Setup

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret for Admin Authentication
ADMIN_JWT_SECRET=your_secure_jwt_secret_here

# Optional: Email Configuration (for future use)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Admin Setup

#### 1. Create Initial Admin User

```bash
# Start your development server
npm run dev

# Create admin user via API
curl -X POST http://localhost:3000/api/setup/admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fimmun.org",
    "password": "your_secure_password",
    "name": "Admin User",
    "role": "super_admin"
  }'
```

#### 2. Access Admin Panel

1. Navigate to `http://localhost:3000/admin`
2. Login with the credentials you created
3. You'll have access to:
   - Dashboard with statistics
   - Private delegates management
   - Committee management
   - User management

### File Upload Configuration

The system supports file uploads for payment proofs. Make sure your Supabase storage is configured:

1. **Storage Bucket**: `payment-proofs`
2. **Allowed File Types**: Images (JPG, PNG) and PDFs
3. **Max File Size**: 10MB (configurable in Supabase)

### API Endpoints Overview

#### Registration Endpoints
- `POST /api/registrations/private-delegate` - Register as private delegate
- `POST /api/registrations/observer` - Register as observer
- `POST /api/registrations/alumni` - Register as alumni
- `POST /api/registrations/delegation` - Register delegation
- `POST /api/registrations/delegation-member` - Register delegation member

#### Admin Management Endpoints
- `GET /api/admin/private-delegates` - Get all private delegates
- `PUT /api/admin/private-delegates` - Update delegate status
- `DELETE /api/admin/private-delegates` - Delete delegate
- Similar endpoints for observers, alumni, delegations, and delegation members

#### Status Checker
- `GET /api/status/[code]` - Check registration status by verification code

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/caps` - Get registration caps
- `PUT /api/dashboard/caps` - Update registration caps

### Frontend Registration Forms

The system includes complete registration forms for all categories:

1. **Private Delegate Registration** (`/registration/private-delegate`)
   - Personal information
   - Committee preferences
   - MUN experience
   - Payment proof upload

2. **Observer Registration** (`/registration/observer`)
   - Personal information
   - MUN experience
   - Payment proof upload

3. **Alumni Registration** (`/registration/alumni`)
   - Personal information
   - Batch information
   - Payment proof upload
   - Special alumni notes

4. **Delegation Registration** (`/registration/delegation`)
   - Delegation information
   - Head delegate details
   - Committee preferences
   - Payment proof upload

5. **Delegation Member Registration** (`/registration/delegation-member`)
   - Personal information
   - Delegation serial number
   - Payment proof upload

### Status Checker

The status checker (`/status-checker`) allows registrants to:
- Enter their verification code
- View registration status
- Download MUN ticket (if verified)
- See serial number (if verified)

### Deployment Checklist

- [ ] Database tables created in Supabase
- [ ] Initial data inserted (committees, caps)
- [ ] RLS policies configured
- [ ] Storage bucket created for payment proofs
- [ ] Environment variables set
- [ ] Initial admin user created
- [ ] File upload tested
- [ ] All registration forms tested
- [ ] Status checker tested
- [ ] Admin panel tested
- [ ] Production deployment completed

### Troubleshooting

#### Common Issues

1. **File Upload Fails**
   - Check Supabase storage configuration
   - Verify bucket policies
   - Check file size limits

2. **Database Connection Errors**
   - Verify environment variables
   - Check Supabase project status
   - Ensure service role key is correct

3. **Admin Login Issues**
   - Verify admin user exists
   - Check JWT secret configuration
   - Clear browser localStorage

4. **Registration Caps Not Working**
   - Check registration_caps table data
   - Verify API endpoint logic
   - Check database constraints

### Security Considerations

1. **File Upload Security**
   - Validate file types and sizes
   - Scan uploaded files for malware
   - Use secure file storage

2. **API Security**
   - Rate limiting on registration endpoints
   - Input validation and sanitization
   - Proper error handling

3. **Database Security**
   - RLS policies configured
   - Service role key protection
   - Regular security audits

### 🚀 Quick Start Guide

1. **Database Setup**
   ```sql
   -- Run the SQL commands from the Database Schema section
   -- Insert committee data
   -- Set up registration caps
   ```

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ADMIN_JWT_SECRET=your_jwt_secret
   ```

3. **Admin Setup**
   ```bash
   # Create initial admin user
   curl -X POST http://localhost:3000/api/setup/admin
   ```

4. **Development**
   ```bash
   npm run dev
   # Access admin panel at /admin
   # Access status checker at /status-checker
   # Access registration forms at /registration
   ```

## File Structure

```
pages/
├── api/
│   ├── registrations/
│   │   ├── private-delegate.ts
│   │   ├── observer.ts
│   │   ├── alumni.ts
│   │   ├── delegation.ts
│   │   └── delegation-member.ts
│   ├── admin/
│   │   ├── private-delegates.ts
│   │   ├── observers.ts
│   │   ├── alumni.ts
│   │   ├── delegations.ts
│   │   └── delegation-members.ts
│   ├── dashboard/
│   │   ├── stats.ts
│   │   └── caps.ts
│   └── status/
│       └── [code].ts
├── admin/
│   ├── dashboard.tsx
│   ├── private-delegates.tsx
│   ├── observers.tsx
│   ├── alumni.tsx
│   └── delegations.tsx
├── registration/
│   ├── private-delegate.tsx
│   ├── observer.tsx
│   ├── alumni.tsx
│   ├── delegation.tsx
│   └── delegation-member.tsx
└── status-checker.tsx

src/
├── components/
│   ├── RegistrationForm.tsx
│   ├── AdminTable.tsx
│   ├── StatusChecker.tsx
│   └── DashboardStats.tsx
└── lib/
    ├── supabaseClient.ts
    ├── constants.ts
    └── utils.ts
```

## Security Considerations

1. **File Upload Security**: Validate file types and sizes for payment proofs
2. **Rate Limiting**: Implement rate limiting for registration endpoints
3. **Input Validation**: Sanitize all user inputs
4. **Admin Authentication**: Secure admin panel with proper authentication
5. **RLS Policies**: Configure Row Level Security in Supabase

## Deployment Checklist

- [ ] Database tables created
- [ ] API endpoints implemented
- [ ] Frontend forms created
- [ ] Admin panel functional
- [ ] Status checker working
- [ ] File upload configured
- [ ] Email notifications (optional)
- [ ] Production deployment

## Support

For implementation support, refer to the individual component files and API documentation within the codebase.