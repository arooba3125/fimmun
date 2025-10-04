import { createAdminClient } from './supabaseClient';

/**
 * Increment the current_count for a specific committee
 * @param committeeName - The name of the committee to increment
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function incrementCommitteeCount(committeeName: string): Promise<boolean> {
  try {
    const supabaseAdmin = createAdminClient();
    
    // First, get the current count
    const { data: committee, error: fetchError } = await supabaseAdmin
      .from('committees')
      .select('current_count, capacity')
      .eq('name', committeeName)
      .single();

    if (fetchError) {
      console.error('Error fetching committee:', fetchError);
      return false;
    }

    if (!committee) {
      console.error(`Committee not found: ${committeeName}`);
      return false;
    }

    // Check if committee is at capacity
    if (committee.current_count >= committee.capacity) {
      console.warn(`Committee ${committeeName} is at capacity (${committee.capacity})`);
      return false;
    }

    // Increment the count
    const { error: updateError } = await supabaseAdmin
      .from('committees')
      .update({ 
        current_count: committee.current_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('name', committeeName);

    if (updateError) {
      console.error('Error updating committee count:', updateError);
      return false;
    }

    console.log(`Successfully incremented count for committee: ${committeeName}`);
    return true;
  } catch (error) {
    console.error('Error in incrementCommitteeCount:', error);
    return false;
  }
}

/**
 * Decrement the current_count for a specific committee
 * @param committeeName - The name of the committee to decrement
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function decrementCommitteeCount(committeeName: string): Promise<boolean> {
  try {
    const supabaseAdmin = createAdminClient();
    
    // First, get the current count
    const { data: committee, error: fetchError } = await supabaseAdmin
      .from('committees')
      .select('current_count')
      .eq('name', committeeName)
      .single();

    if (fetchError) {
      console.error('Error fetching committee:', fetchError);
      return false;
    }

    if (!committee) {
      console.error(`Committee not found: ${committeeName}`);
      return false;
    }

    // Decrement the count (don't go below 0)
    const newCount = Math.max(0, committee.current_count - 1);
    
    const { error: updateError } = await supabaseAdmin
      .from('committees')
      .update({ 
        current_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('name', committeeName);

    if (updateError) {
      console.error('Error updating committee count:', updateError);
      return false;
    }

    console.log(`Successfully decremented count for committee: ${committeeName}`);
    return true;
  } catch (error) {
    console.error('Error in decrementCommitteeCount:', error);
    return false;
  }
}

/**
 * Handle committee count updates for delegation members
 * @param committeePreference - The committee preference of the delegation member
 * @param isVerification - true if verifying, false if unverifying
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function handleDelegationMemberCommitteeCount(
  committeePreference: string, 
  isVerification: boolean
): Promise<boolean> {
  if (!committeePreference) {
    console.warn('No committee preference provided for delegation member');
    return false;
  }

  if (isVerification) {
    return await incrementCommitteeCount(committeePreference);
  } else {
    return await decrementCommitteeCount(committeePreference);
  }
}

/**
 * Handle committee count updates for private delegates
 * @param committeePreferences - Array of committee preferences
 * @param isVerification - true if verifying, false if unverifying
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function handlePrivateDelegateCommitteeCount(
  committeePreferences: string[], 
  isVerification: boolean
): Promise<boolean> {
  if (!committeePreferences || committeePreferences.length === 0) {
    console.warn('No committee preferences provided for private delegate');
    return false;
  }

  // For private delegates, we'll increment the count for the first preference
  // (or you could modify this logic based on your business rules)
  const primaryPreference = committeePreferences[0];
  
  if (isVerification) {
    return await incrementCommitteeCount(primaryPreference);
  } else {
    return await decrementCommitteeCount(primaryPreference);
  }
}
