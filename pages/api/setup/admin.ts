import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if admin_users table exists by trying to select from it
    const { error: checkError } = await supabase
      .from('admin_users')
      .select('email')
      .limit(1);

    if (checkError) {
      return res.status(500).json({
        success: false,
        error: 'admin_users table not found or not accessible',
        details: checkError.message,
        instructions: 'Please create the admin_users table in your Supabase dashboard first'
      });
    }

    // Check if admin already exists
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', 'admin@fimmun.org')
      .single();

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Admin user already exists',
        email: 'admin@fimmun.org'
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const { data: newAdmin, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        email: 'admin@fimmun.org',
        password_hash: hashedPassword,
        name: 'FIMMUN Admin',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create admin user',
        details: insertError.message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role
      },
      credentials: {
        email: 'admin@fimmun.org',
        password: 'admin123'
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}