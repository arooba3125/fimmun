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
  description: string | null;
  capacity: number;
  current_count: number;
  created_at: string;
  updated_at: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

// Registration Interfaces
export interface PrivateDelegate {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  institution: string;
  mun_experience: string | null;
  committee_preferences: string[];
  payment_proof_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  serial_number: string | null;
  verification_code: string;
  created_at: string;
  updated_at: string;
}

export interface Observer {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  institution: string;
  mun_experience: string | null;
  payment_proof_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  serial_number: string | null;
  verification_code: string;
  created_at: string;
  updated_at: string;
}

export interface Alumni {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  batch: string;
  payment_proof_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  serial_number: string | null;
  verification_code: string;
  created_at: string;
  updated_at: string;
}

export interface Delegation {
  id: string;
  delegation_name: string;
  delegation_serial: string;
  committee_preferences: string[];
  head_delegate_name: string;
  head_delegate_email: string;
  head_delegate_whatsapp: string;
  head_delegate_institution: string;
  head_delegate_experience: string | null;
  payment_proof_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface DelegationMember {
  id: string;
  delegation_id: string;
  delegation_serial: string;
  name: string;
  email: string;
  whatsapp: string;
  institution: string;
  mun_experience: string | null;
  committee_preference: string;
  payment_proof_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  serial_number: string | null;
  verification_code: string;
  created_at: string;
  updated_at: string;
}

export interface RegistrationCap {
  id: string;
  category: string;
  max_capacity: number;
  current_count: number;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  day_number: number;
  date: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  event_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}