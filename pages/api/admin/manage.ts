import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '../../../lib/supabaseClient';
import { requireAdminAuth } from '../../../lib/auth-helpers';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseAdmin = createAdminClient();

  // User creation and password changes are disabled
  if (req.method === 'POST') {
    return res.status(403).json({
      success: false,
      error: 'User creation is disabled. Users must be created directly in Supabase Authentication.'
    });
  }

  if (req.method === 'PUT') {
    return res.status(403).json({
      success: false,
      error: 'User updates and password changes are disabled. Manage users directly in Supabase Dashboard.'
    });
  }

  if (req.method === 'GET') {
    // Get all admin users
    try {
      const { data: admins, error } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, name, role, is_active, created_at, last_login')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch admin users',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        admins: admins || []
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch admin users',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'DELETE') {
    return res.status(403).json({
      success: false,
      error: 'User deletion is disabled. Manage users directly in Supabase Dashboard.'
    });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Export with authentication required for all methods
export default requireAdminAuth(handler);