import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseAdmin = createAdminClient();

  if (req.method === 'POST') {
    // Create new admin user
    const { email, password, name, role = 'admin' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      // Auto-hash the password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const { data: newAdmin, error: insertError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          email,
          password_hash: hashedPassword,
          name: name || 'Admin User',
          role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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

      // Test the password hash
      const passwordTest = await bcrypt.compare(password, hashedPassword);

      return res.status(201).json({
        success: true,
        message: 'Admin user created successfully!',
        user: {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role
        },
        passwordHashTest: passwordTest
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Admin user creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    // Update admin user (including password change)
    const { id, email, password, name, role, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (email) updateData.email = email;
      if (name) updateData.name = name;
      if (role) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = is_active;
      
      // Auto-hash password if provided
      if (password) {
        updateData.password_hash = await bcrypt.hash(password, 12);
      }

      const { data: updatedAdmin, error: updateError } = await supabaseAdmin
        .from('admin_users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update admin user',
          details: updateError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Admin user updated successfully!',
        user: {
          id: updatedAdmin.id,
          email: updatedAdmin.email,
          name: updatedAdmin.name,
          role: updatedAdmin.role,
          is_active: updatedAdmin.is_active
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Admin user update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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
    // Delete admin user
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    try {
      const { error: deleteError } = await supabaseAdmin
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete admin user',
          details: deleteError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Admin user deleted successfully!'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Admin user deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}