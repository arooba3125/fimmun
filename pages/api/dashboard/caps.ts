import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseAdmin = createAdminClient();

  if (req.method === 'GET') {
    // Get current registration caps
    try {
      const { data: caps, error } = await supabaseAdmin
        .from('registration_caps')
        .select('*')
        .order('category');

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch registration caps',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        caps: caps || []
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch registration caps',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    // Update registration caps
    const { caps } = req.body;

    if (!caps || !Array.isArray(caps)) {
      return res.status(400).json({ 
        message: 'Caps array is required' 
      });
    }

    try {
      const updatePromises = caps.map(async (cap: { category: string; max_count: number }) => {
        const { data, error } = await supabaseAdmin
          .from('registration_caps')
          .update({
            max_count: cap.max_count,
            updated_at: new Date().toISOString()
          })
          .eq('category', cap.category)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update ${cap.category}: ${error.message}`);
        }

        return data;
      });

      const updatedCaps = await Promise.all(updatePromises);

      return res.status(200).json({
        success: true,
        message: 'Registration caps updated successfully!',
        caps: updatedCaps
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update registration caps',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
