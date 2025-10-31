import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import { requireAdminAuth } from '../../../lib/auth-helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string }) {
  const supabaseAdmin = createAdminClient();

  // GET - Fetch all registration settings
  if (req.method === 'GET') {
    try {
      const { data: settings, error } = await supabaseAdmin
        .from('registration_settings')
        .select('*')
        .order('setting_key');

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch registration settings',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        settings
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch registration settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT - Update a specific setting
  if (req.method === 'PUT') {
    try {
      const { setting_key, setting_value, updated_by } = req.body;

      if (!setting_key || typeof setting_value !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'setting_key and setting_value (boolean) are required'
        });
      }

      // Update the setting
      const { data: updatedSetting, error } = await supabaseAdmin
        .from('registration_settings')
        .update({
          setting_value,
          updated_by: updated_by || 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', setting_key)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update registration setting',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: `Successfully updated ${setting_key} to ${setting_value}`,
        setting: updatedSetting
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update registration setting',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ 
    success: false,
    error: 'Method not allowed. Use GET to fetch settings or PUT to update them.' 
  });
}

export default requireAdminAuth(handler);

