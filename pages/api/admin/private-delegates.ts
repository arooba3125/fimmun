import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import { incrementCommitteeRegistrationCount, decrementCommitteeRegistrationCount } from '../../../lib/committeeRegistrationCaps';
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
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ 
        message: 'ID and status are required' 
      });
    }

    try {
      // First, get the current delegate data to check committee preferences and previous status
      const { data: currentDelegate, error: fetchError } = await supabaseAdmin
        .from('private_delegates')
        .select('committee_preferences, status')
        .eq('id', id)
        .single();

      if (fetchError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch private delegate data',
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

      // Handle committee registration caps updates
      if (currentDelegate?.committee_preferences && currentDelegate.committee_preferences.length > 0) {
        const wasVerified = currentDelegate.status === 'verified';
        const isNowVerified = status === 'verified';
        
        // Only update counts if status actually changed
        if (wasVerified !== isNowVerified) {
          const primaryCommittee = currentDelegate.committee_preferences[0]; // Use first preference
          
          if (isNowVerified) {
            // Increment committee count when verifying
            await incrementCommitteeRegistrationCount(primaryCommittee);
          } else if (wasVerified && !isNowVerified) {
            // Decrement committee count when unverifying
            await decrementCommitteeRegistrationCount(primaryCommittee);
          }
        }
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
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    try {
      // Get delegate info before deletion
      const { data: delegate } = await supabaseAdmin
        .from('private_delegates')
        .select('status, committee_preferences')
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

      // Update committee registration cap if delegate was verified
      if (delegate && delegate.status === 'verified' && delegate.committee_preferences && delegate.committee_preferences.length > 0) {
        await decrementCommitteeRegistrationCount(delegate.committee_preferences[0]);
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

  return res.status(405).json({ message: 'Method not allowed' });
}

export default requireAdminAuth(handler);
