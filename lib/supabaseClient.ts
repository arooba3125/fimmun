import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please check your .env.local file.');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env.local file.');
}

// Public client for frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (only use on server-side)
// This will only be created when actually used in API routes
export const createAdminClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client should not be used on the frontend');
  }
  
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey.includes('PLACEHOLDER')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations. Please get your service role key from Supabase Dashboard > Settings > API');
  }
  return createClient(supabaseUrl, serviceKey);
};

// Database types
export interface Committee {
  id: string;
  name: string;
  short_name: string | null;
  topic: string | null;
  description: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null;
  max_delegates: number;
  current_delegates: number;
  chair_name: string | null;
  chair_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}


export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}
