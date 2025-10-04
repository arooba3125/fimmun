import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';

// Generate serial number
async function generateSerialNumber(supabase: ReturnType<typeof createAdminClient>, prefix: string): Promise<string> {
  const { data } = await supabase
    .from('alumni')
    .select('serial_number')
    .like('serial_number', `${prefix}-%`)
    .order('created_at', { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastSerial = data[0].serial_number;
    const lastNumber = parseInt(lastSerial.split('-')[1]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        const serialNumber = await generateSerialNumber(supabaseAdmin, 'OA');
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
      // Get alumni info before deletion
      const { data: alumni } = await supabaseAdmin
        .from('alumni')
        .select('status')
        .eq('id', id)
        .single();

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

      // Update registration cap if alumni was verified
      if (alumni && alumni.status === 'verified') {
        const { data: capData } = await supabaseAdmin
          .from('registration_caps')
          .select('current_count')
          .eq('category', 'alumni')
          .single();

        if (capData) {
          await supabaseAdmin
            .from('registration_caps')
            .update({ 
              current_count: Math.max(0, capData.current_count - 1),
              updated_at: new Date().toISOString()
            })
            .eq('category', 'alumni');
        }
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
