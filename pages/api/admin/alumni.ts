import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import { generateUniqueSerialNumber, SERIAL_NUMBER_CATEGORIES } from '../../../lib/serialNumberUtils';
import { requireAdminAuth } from '../../../lib/auth-helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string }) {
  const supabaseAdmin = createAdminClient();

  if (req.method === 'GET') {
    // Get all alumni
    try {
      const { data: alumni, error } = await supabaseAdmin
        .from('alumni')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch alumni',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        alumni: alumni || []
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch alumni',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    // Update alumni status
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ 
        message: 'ID and status are required' 
      });
    }

    try {

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (status === 'verified') {
        // Generate serial number when verifying
        const serialNumber = await generateUniqueSerialNumber(SERIAL_NUMBER_CATEGORIES.ALUMNI);
        updateData.serial_number = serialNumber;
      }

      updateData.status = status;

      const { data: updatedAlumni, error: updateError } = await supabaseAdmin
        .from('alumni')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update alumni',
          details: updateError.message
        });
      }

      // Alumni registration doesn't affect committee caps

      return res.status(200).json({
        success: true,
        message: 'Alumni updated successfully!',
        alumni: updatedAlumni
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Alumni update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'DELETE') {
    // Delete alumni
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    try {
      // Alumni deletion doesn't affect committee caps

      // Delete the alumni
      const { error: deleteError } = await supabaseAdmin
        .from('alumni')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete alumni',
          details: deleteError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Alumni deleted successfully!'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Alumni deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default requireAdminAuth(handler);
