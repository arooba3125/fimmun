import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    
    // First, try to get the setting from the database
    const { data: setting, error } = await supabase
      .from('registration_settings')
      .select('setting_value')
      .eq('setting_key', 'alumni_registration_active')
      .single();

    let isActive = false;

    if (error || !setting) {
      // Fallback to environment variable if database check fails
      console.log('Database check failed, falling back to environment variable:', error?.message);
      isActive = process.env.ALUMNI_REGISTRATION_ACTIVE === 'true';
    } else {
      // Use database value
      isActive = setting.setting_value;
    }

    return res.status(200).json({
      success: true,
      isActive,
      message: isActive ? 'Alumni registration is open' : 'Alumni registration will be opened soon',
      source: error ? 'environment' : 'database'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to check registration status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

