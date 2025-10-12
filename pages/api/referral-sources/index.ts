import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Use admin client to bypass RLS for public access
      const supabaseAdmin = createAdminClient();
      
      // Fetch all active referral sources, ordered by name
      const { data, error } = await supabaseAdmin
        .from('referral_sources')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching referral sources:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch referral sources' 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data 
      });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

