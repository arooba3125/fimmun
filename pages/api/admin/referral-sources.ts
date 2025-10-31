import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import { requireAdminAuth } from '../../../lib/auth-helpers';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseAdmin = createAdminClient();

  // Handle different methods
  if (req.method === 'GET') {
    try {
      // Fetch all referral sources (including inactive ones for admin)
      const { data, error } = await supabaseAdmin
        .from('referral_sources')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching referral sources:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to fetch referral sources' 
        });
      }

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  if (req.method === 'POST') {
    try {
      // Create new referral source
      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Name is required' 
        });
      }

      const { data, error } = await supabaseAdmin
        .from('referral_sources')
        .insert([{ name: name.trim(), count: 0, is_active: true }])
        .select()
        .single();

      if (error) {
        console.error('Error creating referral source:', error);
        
        // Check for unique constraint violation
        if (error.code === '23505') {
          return res.status(400).json({ 
            success: false, 
            message: 'A referral source with this name already exists' 
          });
        }
        
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to create referral source' 
        });
      }

      return res.status(201).json({ success: true, data });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      // Update existing referral source
      const { id, name, is_active } = req.body;

      if (!id) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID is required' 
        });
      }

      const updateData: { name?: string; is_active?: boolean; updated_at: string } = {
        updated_at: new Date().toISOString()
      };

      if (name !== undefined && typeof name === 'string' && name.trim() !== '') {
        updateData.name = name.trim();
      }

      if (is_active !== undefined && typeof is_active === 'boolean') {
        updateData.is_active = is_active;
      }

      const { data, error } = await supabaseAdmin
        .from('referral_sources')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating referral source:', error);
        
        // Check for unique constraint violation
        if (error.code === '23505') {
          return res.status(400).json({ 
            success: false, 
            message: 'A referral source with this name already exists' 
          });
        }
        
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to update referral source' 
        });
      }

      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Delete referral source
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID is required' 
        });
      }

      // Check if referral source is being used
      const { count: delegationCount } = await supabaseAdmin
        .from('delegations')
        .select('*', { count: 'exact', head: true })
        .eq('referral_source_id', id);

      const { count: alumniCount } = await supabaseAdmin
        .from('alumni')
        .select('*', { count: 'exact', head: true })
        .eq('referral_source_id', id);

      const { count: observerCount } = await supabaseAdmin
        .from('observers')
        .select('*', { count: 'exact', head: true })
        .eq('referral_source_id', id);

      const { count: privateDelegateCount } = await supabaseAdmin
        .from('private_delegates')
        .select('*', { count: 'exact', head: true })
        .eq('referral_source_id', id);

      const { count: delegationMemberCount } = await supabaseAdmin
        .from('delegation_members')
        .select('*', { count: 'exact', head: true })
        .eq('referral_source_id', id);

      const totalUsage = (delegationCount || 0) + (alumniCount || 0) + 
                         (observerCount || 0) + (privateDelegateCount || 0) + 
                         (delegationMemberCount || 0);

      if (totalUsage > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot delete this referral source as it is being used by ${totalUsage} registration(s). Consider deactivating it instead.` 
        });
      }

      const { error } = await supabaseAdmin
        .from('referral_sources')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting referral source:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to delete referral source' 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Referral source deleted successfully' 
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

export default requireAdminAuth(handler);

