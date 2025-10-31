import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import { incrementCommitteeRegistrationCount, decrementCommitteeRegistrationCount } from '../../../lib/committeeRegistrationCaps';
import { requireAdminAuth } from '../../../lib/auth-helpers';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseAdmin = createAdminClient();

  if (req.method === 'GET') {
    // Get all delegations with member count
    try {
      const { data: delegations, error } = await supabaseAdmin
        .from('delegations')
        .select(`
          *,
          delegation_members (
            id,
            name,
            email,
            whatsapp,
            institution,
            mun_experience,
            status,
            serial_number,
            verification_code,
            created_at,
            updated_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch delegations',
          details: error.message
        });
      }

      // Add member count to each delegation
      const delegationsWithCount = delegations?.map(delegation => ({
        ...delegation,
        member_count: delegation.delegation_members?.length || 0,
        verified_members: delegation.delegation_members?.filter((member: { status: string }) => member.status === 'verified').length || 0
      }));

      return res.status(200).json({
        success: true,
        delegations: delegationsWithCount || []
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch delegations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    // Update delegation status
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ 
        message: 'ID and status are required' 
      });
    }

    try {
      // First, get the current delegation data to check committee preferences and previous status
      const { data: currentDelegation, error: fetchError } = await supabaseAdmin
        .from('delegations')
        .select('status, committee_preferences')
        .eq('id', id)
        .single();

      if (fetchError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch delegation data',
          details: fetchError.message
        });
      }

      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString()
      };

      const { data: updatedDelegation, error: updateError } = await supabaseAdmin
        .from('delegations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update delegation',
          details: updateError.message
        });
      }

      // Handle committee registration caps updates for head delegate
      if (currentDelegation?.committee_preferences && currentDelegation.committee_preferences.length > 0) {
        const wasVerified = currentDelegation.status === 'verified';
        const isNowVerified = status === 'verified';
        
        // Only update counts if status actually changed
        if (wasVerified !== isNowVerified) {
          const headDelegateCommittee = currentDelegation.committee_preferences[0]; // Head delegate committee
          
          if (isNowVerified) {
            // Increment committee count when verifying
            await incrementCommitteeRegistrationCount(headDelegateCommittee);
          } else if (wasVerified && !isNowVerified) {
            // Decrement committee count when unverifying
            await decrementCommitteeRegistrationCount(headDelegateCommittee);
          }
        }
      }

      // Auto-approve delegation head when delegation is approved
      if (status === 'verified') {
        try {
          // Get delegation info to find head delegate
          const { data: delegationInfo } = await supabaseAdmin
            .from('delegations')
            .select('head_delegate_email')
            .eq('id', id)
            .single();

          if (delegationInfo?.head_delegate_email) {
            // Update head delegate status to verified
            await supabaseAdmin
              .from('delegation_members')
              .update({
                status: 'verified',
                updated_at: new Date().toISOString()
              })
              .eq('delegation_id', id)
              .eq('email', delegationInfo.head_delegate_email);
          }
        } catch (error) {
          console.warn('Failed to auto-approve delegation head:', error);
          // Don't fail the main operation if head approval fails
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Delegation updated successfully!',
        delegation: updatedDelegation
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Delegation update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'DELETE') {
    // Delete delegation and all its members
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    try {
      // Delete all delegation members first
      await supabaseAdmin
        .from('delegation_members')
        .delete()
        .eq('delegation_id', id);

      // Delete the delegation
      const { error: deleteError } = await supabaseAdmin
        .from('delegations')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete delegation',
          details: deleteError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Delegation and all members deleted successfully!'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Delegation deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default requireAdminAuth(handler);
