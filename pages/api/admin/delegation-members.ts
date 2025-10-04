import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';

// Generate serial number for delegation members (same as private delegates)
async function generateSerialNumber(supabase: ReturnType<typeof createAdminClient>, prefix: string): Promise<string> {
  const { data } = await supabase
    .from('delegation_members')
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
    // Get all delegation members with delegation info
    try {
      const { data: members, error } = await supabaseAdmin
        .from('delegation_members')
        .select(`
          *,
          delegations (
            delegation_name,
            delegation_serial
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch delegation members',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        members: members || []
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch delegation members',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    // Update delegation member status
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
        const serialNumber = await generateSerialNumber(supabaseAdmin, 'OD');
        updateData.serial_number = serialNumber;
      }

      updateData.status = status;

      const { data: updatedMember, error: updateError } = await supabaseAdmin
        .from('delegation_members')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          delegations (
            delegation_name,
            delegation_serial
          )
        `)
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update delegation member',
          details: updateError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Delegation member updated successfully!',
        member: updatedMember
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Delegation member update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'DELETE') {
    // Delete delegation member
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    try {
      // Delete the delegation member
      const { error: deleteError } = await supabaseAdmin
        .from('delegation_members')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete delegation member',
          details: deleteError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Delegation member deleted successfully!'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Delegation member deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
