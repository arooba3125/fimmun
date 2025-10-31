import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Prevent caching of sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Security: Only allow setup in development or with secret token
  const isDev = process.env.NODE_ENV === 'development';
  const setupToken = req.headers['x-setup-token'] || req.body?.setupToken;
  const expectedToken = process.env.SETUP_SECRET_TOKEN;

  if (!isDev) {
    if (!expectedToken) {
      return res.status(403).json({
        success: false,
        error: 'Setup is disabled in production. Set SETUP_SECRET_TOKEN environment variable and provide it in X-Setup-Token header.'
      });
    }

    if (!setupToken || setupToken !== expectedToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid setup token'
      });
    }
  }

  try {
    const supabaseAdmin = createAdminClient();
    
    // Check if admin_users table exists by trying to select from it
    const { error: checkError } = await supabaseAdmin
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

    // Check if admin already exists (prevent re-setup)
    const { data: existingAdmins, error: checkAdminError } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .limit(1);

    if (!checkAdminError && existingAdmins && existingAdmins.length > 0) {
      return res.status(403).json({
        success: false,
        error: 'Admin user already exists. Setup can only be run once.',
        message: 'If you need to create additional admins, use the admin management interface after logging in.'
      });
    }

    // Generate random password instead of hardcoded one
    const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '!@#';
    const hashedPassword = await bcrypt.hash(randomPassword, 12);
    
    // Get admin email from environment or use default
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fimmun.org';
    
    const { data: newAdmin, error: insertError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        email: adminEmail,
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

    // SECURITY: In production, don't return password in response
    // Log it server-side only or send via secure channel
    const response: {
      success: boolean;
      message: string;
      user: { email: string; name: string; role: string };
      credentials?: { email: string; password: string; warning: string };
    } = {
      success: true,
      message: 'Admin user created successfully',
      user: {
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role
      }
    };

    // Only return password in development
    if (isDev) {
      response.credentials = {
        email: adminEmail,
        password: randomPassword,
        warning: '⚠️ Store these credentials securely. This password will not be shown again.'
      };
    } else {
      response.message += '. Check server logs for initial password.';
      // Log password server-side only (in production, use secure logging service)
      console.error('🔐 ADMIN SETUP PASSWORD (SAVE THIS SECURELY):', randomPassword);
      console.error('🔐 Admin Email:', adminEmail);
    }

    return res.status(201).json(response);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}