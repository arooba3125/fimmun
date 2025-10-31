import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import { generateUniqueSerialNumber, SERIAL_NUMBER_CATEGORIES } from '../../../lib/serialNumberUtils';
import { requireAdminAuth } from '../../../lib/auth-helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string }) {
  const supabaseAdmin = createAdminClient();

  if (req.method === 'GET') {
    // Get all private delegates
    try {
      const { data: delegates, error } = await supabaseAdmin
        .from('private_delegates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch private delegates',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        delegates: delegates || []
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch private delegates',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    // Update private delegate status
    const { id, status } = req.body as { id?: string; status?: 'verified' | 'rejected' };

    if (!id || !status) {
      return res.status(400).json({ 
        success: false,
        error: 'ID and status are required' 
      });
    }

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (status === 'verified') {
        // Generate serial number when verifying
        const serialNumber = await generateUniqueSerialNumber(SERIAL_NUMBER_CATEGORIES.DELEGATES);
        updateData.serial_number = serialNumber;
      }

      updateData.status = status;

      const { data: updatedDelegate, error: updateError } = await supabaseAdmin
        .from('private_delegates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update private delegate',
          details: updateError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Private delegate updated successfully!',
        delegate: updatedDelegate
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Private delegate update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'DELETE') {
    // Delete private delegate
    const { id } = req.body as { id?: string };

    if (!id) {
      return res.status(400).json({ success: false, error: 'ID is required' });
    }

    try {
      // Get delegate info before deletion
      const { data: delegate } = await supabaseAdmin
        .from('private_delegates')
        .select('status')
        .eq('id', id)
        .single();

      // Delete the delegate
      const { error: deleteError } = await supabaseAdmin
        .from('private_delegates')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete private delegate',
          details: deleteError.message
        });
      }

      // Update registration cap if delegate was verified
      if (delegate && delegate.status === 'verified') {
        const { data: capData } = await supabaseAdmin
          .from('registration_caps')
          .select('current_count')
          .eq('category', 'delegates')
          .single();

        if (capData) {
          await supabaseAdmin
            .from('registration_caps')
            .update({ 
              current_count: Math.max(0, capData.current_count - 1),
              updated_at: new Date().toISOString()
            })
            .eq('category', 'delegates');
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Private delegate deleted successfully!'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Private delegate deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

export default requireAdminAuth(handler);

