# Deployment Guide for FIMMUN

## Environment Variables Setup

### Required Environment Variables

This project requires the following environment variables to be set:

1. `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
3. `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)

### Local Development Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual Supabase credentials in `.env.local`

### Vercel Deployment Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each of the required environment variables:
   - Key: `NEXT_PUBLIC_SUPABASE_URL`, Value: `https://your-project-id.supabase.co`
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Value: `your-anon-key`
   - Key: `SUPABASE_SERVICE_ROLE_KEY`, Value: `your-service-role-key`

4. Make sure to set them for all environments (Production, Preview, Development)

### Getting Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Build Error Fix

The recent build error was caused by missing environment variables during the build process. This has been fixed by:

1. **Modified Supabase client** to handle build-time environment gracefully
2. **Added proper environment validation** that doesn't throw errors during build
3. **Created fallback handling** for missing environment variables

After setting up the environment variables in Vercel, your deployment should work correctly.

## Troubleshooting

### Build Fails with "Missing NEXT_PUBLIC_SUPABASE_URL"

1. Ensure all environment variables are set in Vercel dashboard
2. Redeploy the project after adding environment variables
3. Check that variable names match exactly (case-sensitive)

### Database Connection Issues

1. Verify your Supabase project is active
2. Check that the project URL and keys are correct
3. Ensure your Supabase project has the required tables and RLS policies

### RLS (Row Level Security) Issues

If you encounter permission errors:
1. Check your Supabase RLS policies
2. Ensure the service role key is set correctly for admin operations
3. Review the database migration files in `database_migrations/` folder