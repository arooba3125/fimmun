import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import { incrementCommitteeRegistrationCount, decrementCommitteeRegistrationCount } from '../../../lib/committeeRegistrationCaps';
import { generateUniqueSerialNumber, SERIAL_NUMBER_CATEGORIES } from '../../../lib/serialNumberUtils';

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
      // First, get the current member data to check committee preference and previous status
      const { data: currentMember, error: fetchError } = await supabaseAdmin
        .from('delegation_members')
        .select('committee_preference, status, delegation_id, email')
        .eq('id', id)
        .single();

      if (fetchError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch delegation member data',
          details: fetchError.message
        });
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (status === 'verified') {
        // Generate serial number when verifying
        const serialNumber = await generateUniqueSerialNumber(SERIAL_NUMBER_CATEGORIES.DELEGATES);
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

      // Handle committee count and registration caps updates
      if (currentMember?.committee_preference) {
        const wasVerified = currentMember.status === 'verified';
        const isNowVerified = status === 'verified';
        
        // Only update counts if status actually changed
        if (wasVerified !== isNowVerified) {
          // Update committee registration count
          if (currentMember.committee_preference) {
            if (isNowVerified) {
              // Increment committee count when verifying
              await incrementCommitteeRegistrationCount(currentMember.committee_preference);
            } else if (wasVerified && !isNowVerified) {
              // Decrement committee count when unverifying
              await decrementCommitteeRegistrationCount(currentMember.committee_preference);
            }
          }
        }
      }

      // Auto-approve delegation when head delegate is approved
      if (status === 'verified' && updatedMember) {
        try {
          // Check if this member is the head delegate
          const { data: delegationInfo } = await supabaseAdmin
            .from('delegations')
            .select('id, head_delegate_email, status')
            .eq('id', updatedMember.delegation_id)
            .single();

          if (delegationInfo && 
              delegationInfo.head_delegate_email === updatedMember.email && 
              delegationInfo.status === 'pending') {
            // Auto-approve the delegation
            await supabaseAdmin
              .from('delegations')
              .update({
                status: 'verified',
                updated_at: new Date().toISOString()
              })
              .eq('id', updatedMember.delegation_id);
          }
        } catch (error) {
          console.warn('Failed to auto-approve delegation:', error);
          // Don't fail the main operation if delegation approval fails
        }
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
      // Get member info before deletion to check if we need to update counts
      const { data: member } = await supabaseAdmin
        .from('delegation_members')
        .select('status, committee_preference')
        .eq('id', id)
        .single();

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

      // Update committee registration cap if member was verified
      if (member && member.status === 'verified' && member.committee_preference) {
        await decrementCommitteeRegistrationCount(member.committee_preference);
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
