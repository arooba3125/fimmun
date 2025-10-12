import { createAdminClient } from './supabaseClient';

export interface CommitteeRegistrationCap {
  id: string;
  committee_name: string;
  max_capacity: number;
  current_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all committee registration caps
 * @returns Promise<CommitteeRegistrationCap[]> - Array of committee caps
 */
export async function getCommitteeRegistrationCaps(): Promise<CommitteeRegistrationCap[]> {
  try {
    const supabaseAdmin = createAdminClient();
    
    const { data, error } = await supabaseAdmin
      .from('committee_registration_caps')
      .select('*')
      .order('committee_name');

    if (error) {
      console.error('Error fetching committee registration caps:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCommitteeRegistrationCaps:', error);
    return [];
  }
}

/**
 * Increment the current_count for a specific committee
 * @param committeeName - The name of the committee to increment
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function incrementCommitteeRegistrationCount(committeeName: string): Promise<boolean> {
  try {
    const supabaseAdmin = createAdminClient();
    
    // First, get the current count and capacity
    const { data: cap, error: fetchError } = await supabaseAdmin
      .from('committee_registration_caps')
      .select('current_count, max_capacity')
      .eq('committee_name', committeeName)
      .single();

    if (fetchError) {
      console.error('Error fetching committee registration cap:', fetchError);
      return false;
    }

    if (!cap) {
      console.error(`Committee registration cap not found: ${committeeName}`);
      return false;
    }

    // Check if committee is at capacity
    if (cap.current_count >= cap.max_capacity) {
      console.warn(`Committee ${committeeName} is at capacity (${cap.max_capacity})`);
      return false;
    }

    // Increment the count
    const { error: updateError } = await supabaseAdmin
      .from('committee_registration_caps')
      .update({ 
        current_count: cap.current_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('committee_name', committeeName);

    if (updateError) {
      console.error('Error updating committee registration count:', updateError);
      return false;
    }

    console.log(`Successfully incremented registration count for committee: ${committeeName}`);
    return true;
  } catch (error) {
    console.error('Error in incrementCommitteeRegistrationCount:', error);
    return false;
  }
}

/**
 * Decrement the current_count for a specific committee
 * @param committeeName - The name of the committee to decrement
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function decrementCommitteeRegistrationCount(committeeName: string): Promise<boolean> {
  try {
    const supabaseAdmin = createAdminClient();
    
    // First, get the current count
    const { data: cap, error: fetchError } = await supabaseAdmin
      .from('committee_registration_caps')
      .select('current_count')
      .eq('committee_name', committeeName)
      .single();

    if (fetchError) {
      console.error('Error fetching committee registration cap:', fetchError);
      return false;
    }

    if (!cap) {
      console.error(`Committee registration cap not found: ${committeeName}`);
      return false;
    }

    // Decrement the count (don't go below 0)
    const newCount = Math.max(0, cap.current_count - 1);
    
    const { error: updateError } = await supabaseAdmin
      .from('committee_registration_caps')
      .update({ 
        current_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('committee_name', committeeName);

    if (updateError) {
      console.error('Error updating committee registration count:', updateError);
      return false;
    }

    console.log(`Successfully decremented registration count for committee: ${committeeName}`);
    return true;
  } catch (error) {
    console.error('Error in decrementCommitteeRegistrationCount:', error);
    return false;
  }
}

/**
 * Update committee registration caps (for admin use)
 * @param caps - Array of committee caps to update
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function updateCommitteeRegistrationCaps(caps: { committee_name: string; max_capacity: number }[]): Promise<boolean> {
  try {
    const supabaseAdmin = createAdminClient();
    
    const updatePromises = caps.map(async (cap) => {
      const { error } = await supabaseAdmin
        .from('committee_registration_caps')
        .update({
          max_capacity: cap.max_capacity,
          updated_at: new Date().toISOString()
        })
        .eq('committee_name', cap.committee_name);

      if (error) {
        throw new Error(`Failed to update ${cap.committee_name}: ${error.message}`);
      }
    });

    await Promise.all(updatePromises);
    console.log('Successfully updated committee registration caps');
    return true;
  } catch (error) {
    console.error('Error in updateCommitteeRegistrationCaps:', error);
    return false;
  }
}

/**
 * Manually adjust the current_count for a specific committee
 * @param committeeName - The name of the committee to adjust
 * @param adjustment - The amount to adjust (positive to increase, negative to decrease)
 * @returns Promise<{ success: boolean; newCount?: number; error?: string }> 
 */
export async function manuallyAdjustCommitteeCount(
  committeeName: string, 
  adjustment: number
): Promise<{ success: boolean; newCount?: number; error?: string }> {
  try {
    const supabaseAdmin = createAdminClient();
    
    // First, get the current count and capacity
    const { data: cap, error: fetchError } = await supabaseAdmin
      .from('committee_registration_caps')
      .select('current_count, max_capacity')
      .eq('committee_name', committeeName)
      .single();

    if (fetchError) {
      console.error('Error fetching committee registration cap:', fetchError);
      return { success: false, error: 'Failed to fetch committee data' };
    }

    if (!cap) {
      console.error(`Committee registration cap not found: ${committeeName}`);
      return { success: false, error: 'Committee not found' };
    }

    // Calculate new count
    const newCount = Math.max(0, cap.current_count + adjustment);

    // Optional: Check if new count exceeds capacity (warning but not blocking)
    if (newCount > cap.max_capacity) {
      console.warn(`Manual adjustment will exceed capacity for ${committeeName}: ${newCount} > ${cap.max_capacity}`);
    }

    // Update the count
    const { error: updateError } = await supabaseAdmin
      .from('committee_registration_caps')
      .update({ 
        current_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('committee_name', committeeName);

    if (updateError) {
      console.error('Error updating committee registration count:', updateError);
      return { success: false, error: 'Failed to update count' };
    }

    console.log(`Successfully adjusted registration count for ${committeeName}: ${cap.current_count} -> ${newCount} (${adjustment > 0 ? '+' : ''}${adjustment})`);
    return { success: true, newCount };
  } catch (error) {
    console.error('Error in manuallyAdjustCommitteeCount:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Reset all committee registration counts to 0 (for admin use)
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function resetCommitteeRegistrationCounts(): Promise<boolean> {
  try {
    const supabaseAdmin = createAdminClient();
    
    const { error } = await supabaseAdmin
      .from('committee_registration_caps')
      .update({
        current_count: 0,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error resetting committee registration counts:', error);
      return false;
    }

    console.log('Successfully reset all committee registration counts');
    return true;
  } catch (error) {
    console.error('Error in resetCommitteeRegistrationCounts:', error);
    return false;
  }
}
