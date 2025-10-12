import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import { generateUniqueSerialNumber, SERIAL_NUMBER_CATEGORIES } from '../../../lib/serialNumberUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseAdmin = createAdminClient();

  if (req.method === 'GET') {
    // Get all observers
    try {
      const { data: observers, error } = await supabaseAdmin
        .from('observers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch observers',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        observers: observers || []
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch observers',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    // Update observer status
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
        const serialNumber = await generateUniqueSerialNumber(SERIAL_NUMBER_CATEGORIES.OBSERVERS);
        updateData.serial_number = serialNumber;
      }

      updateData.status = status;

      const { data: updatedObserver, error: updateError } = await supabaseAdmin
        .from('observers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update observer',
          details: updateError.message
        });
      }

      // Observers don't have committee assignments, so no committee caps to update

      return res.status(200).json({
        success: true,
        message: 'Observer updated successfully!',
        observer: updatedObserver
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Observer update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'DELETE') {
    // Delete observer
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    try {
      // Get observer info before deletion
      const { data: observer } = await supabaseAdmin
        .from('observers')
        .select('status')
        .eq('id', id)
        .single();

      // Delete the observer
      const { error: deleteError } = await supabaseAdmin
        .from('observers')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete observer',
          details: deleteError.message
        });
      }

      // Update registration cap if observer was verified
      if (observer && observer.status === 'verified') {
        const { data: capData } = await supabaseAdmin
          .from('registration_caps')
          .select('current_count')
          .eq('category', 'observers')
          .single();

        if (capData) {
          await supabaseAdmin
            .from('registration_caps')
            .update({ 
              current_count: Math.max(0, capData.current_count - 1),
              updated_at: new Date().toISOString()
            })
            .eq('category', 'observers');
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Observer deleted successfully!'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Observer deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
