import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabaseAdmin = createAdminClient();

  try {
    // First, let's check what columns exist in the committees table
    const { data: sampleCommittee, error: sampleError } = await supabaseAdmin
      .from('committees')
      .select('*')
      .limit(1);

    if (sampleError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch committee structure',
        details: sampleError.message
      });
    }

    console.log('Committee structure:', sampleCommittee);

    // Reset all committee counts to 0 - try different possible column names
    const resetData: Record<string, number> = {};
    
    // Check if current_count exists
    if (sampleCommittee && sampleCommittee.length > 0) {
      const committee = sampleCommittee[0];
      if ('current_count' in committee) {
        resetData.current_count = 0;
      } else if ('current_delegates' in committee) {
        resetData.current_delegates = 0;
      } else {
        // If neither exists, we'll need to add the column
        return res.status(500).json({
          success: false,
          error: 'Committee table does not have current_count or current_delegates column',
          details: 'Please check your database schema'
        });
      }
    }

    const { error: resetError } = await supabaseAdmin
      .from('committees')
      .update(resetData)
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This ensures we update all records

    if (resetError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to reset committee counts',
        details: resetError.message
      });
    }

    // Get all committees
    const { data: committees, error: committeesError } = await supabaseAdmin
      .from('committees')
      .select('name');

    if (committeesError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch committees',
        details: committeesError.message
      });
    }

    // Determine which column to use for updating
    const countColumn = resetData.current_count !== undefined ? 'current_count' : 'current_delegates';

    // Count verified delegation members for each committee
    for (const committee of committees || []) {
      let delegationCount = 0;
      
      // Try to get delegation members, but don't fail if table doesn't exist or is empty
      try {
        const { data: delegationMembers, error: dmError } = await supabaseAdmin
          .from('delegation_members')
          .select('id, committee_preference')
          .eq('status', 'verified');

        if (dmError) {
          console.log(`Delegation members table might not exist or be empty for ${committee.name}:`, dmError.message);
        } else if (delegationMembers) {
          delegationCount = delegationMembers.filter(member => {
            if (!member.committee_preference) {
              return false;
            }
            
            // Exact match
            if (member.committee_preference === committee.name) {
              return true;
            }
            
            // Fuzzy matching for common variations
            const committeeName = committee.name.toLowerCase();
            const preference = member.committee_preference.toLowerCase();
            
            // Check if preference is contained in committee name or vice versa
            if (committeeName.includes(preference) || preference.includes(committeeName)) {
              return true;
            }
            
            // Handle specific known variations
            const variations: Record<string, string> = {
              'disarmament and international security committee': 'united nations disarmament and international security committee (undisec)',
              'united nations human rights council': 'united nations human rights council (unhrc)',
              'united nations security council': 'united nations security council (unsc)',
              'united nations status of women committee': 'united nations status of women committee (unscw)',
              'organization of islamic cooperation': 'organization of islamic cooperation (oic)',
              'pakistan national assembly': 'pakistan national assembly (pna)',
              'crisis committee': 'crisis committee '
            };
            
            if (variations[preference] && variations[preference] === committee.name.toLowerCase()) {
              return true;
            }
            
            return false;
          }).length;
        }
      } catch (error) {
        console.log(`Error accessing delegation_members table:`, error);
        delegationCount = 0;
      }

      // Count verified private delegates for each committee (using first preference)
      let privateDelegateCount = 0;
      
      try {
        const { data: privateDelegates, error: pdError } = await supabaseAdmin
          .from('private_delegates')
          .select('id, committee_preferences')
          .eq('status', 'verified');

        if (pdError) {
          console.log(`Error counting private delegates for ${committee.name}:`, pdError.message);
        } else if (privateDelegates) {
          privateDelegateCount = privateDelegates.filter(delegate => {
            if (!delegate.committee_preferences || delegate.committee_preferences.length === 0) {
              return false;
            }
            
            const firstPreference = delegate.committee_preferences[0];
            
            // Exact match
            if (firstPreference === committee.name) {
              return true;
            }
            
            // Fuzzy matching for common variations
            const committeeName = committee.name.toLowerCase();
            const preference = firstPreference.toLowerCase();
            
            // Check if preference is contained in committee name or vice versa
            if (committeeName.includes(preference) || preference.includes(committeeName)) {
              return true;
            }
            
            // Handle specific known variations
            const variations: Record<string, string> = {
              'disarmament and international security committee': 'united nations disarmament and international security committee (undisec)',
              'united nations human rights council': 'united nations human rights council (unhrc)',
              'united nations security council': 'united nations security council (unsc)',
              'united nations status of women committee': 'united nations status of women committee (unscw)',
              'organization of islamic cooperation': 'organization of islamic cooperation (oic)',
              'pakistan national assembly': 'pakistan national assembly (pna)',
              'crisis committee': 'crisis committee '
            };
            
            if (variations[preference] && variations[preference] === committee.name.toLowerCase()) {
              return true;
            }
            
            return false;
          }).length;
        }
      } catch (error) {
        console.log(`Error accessing private_delegates table:`, error);
        privateDelegateCount = 0;
      }

      const totalCount = delegationCount + privateDelegateCount;

      // Update the committee count using the correct column
      const updateData: Record<string, number | string> = {
        [countColumn]: totalCount,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabaseAdmin
        .from('committees')
        .update(updateData)
        .eq('name', committee.name);

      if (updateError) {
        console.error(`Error updating count for ${committee.name}:`, updateError);
      }
    }

    // Get updated committees
    const selectFields = countColumn === 'current_count' 
      ? 'name, current_count, capacity' 
      : 'name, current_delegates, max_delegates';
      
    const { data: updatedCommittees, error: fetchError } = await supabaseAdmin
      .from('committees')
      .select(selectFields)
      .order('name');

    if (fetchError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch updated committees',
        details: fetchError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Committee counts recalculated successfully!',
      committees: updatedCommittees
    });

  } catch (error) {
    console.error('Error recalculating committee counts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to recalculate committee counts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
