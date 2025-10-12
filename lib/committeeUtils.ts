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

/**
 * Update registration caps count for a specific category
 * @param category - The category to update ('delegates', 'observers', 'alumni')
 * @param isVerification - true if verifying (increment), false if unverifying (decrement)
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function updateRegistrationCapsCount(category: string, isVerification: boolean): Promise<boolean> {
  try {
    const supabaseAdmin = createAdminClient();
    
    // Get current count for the specific category
    const { data: capData, error: fetchError } = await supabaseAdmin
      .from('registration_caps')
      .select('current_count, max_count')
      .eq('category', category)
      .single();

    if (fetchError) {
      console.error(`Error fetching registration caps for ${category}:`, fetchError);
      return false;
    }

    if (!capData) {
      console.error(`No registration caps found for ${category}`);
      return false;
    }

    let newCount;
    if (isVerification) {
      // Check if at capacity
      if (capData.current_count >= capData.max_count) {
        console.warn(`${category} registration is at capacity (${capData.max_count})`);
        return false;
      }
      newCount = capData.current_count + 1;
    } else {
      // Don't go below 0
      newCount = Math.max(0, capData.current_count - 1);
    }

    const { error: updateError } = await supabaseAdmin
      .from('registration_caps')
      .update({ 
        current_count: newCount,
        updated_at: new Date().toISOString()
      })
      .eq('category', category);

    if (updateError) {
      console.error(`Error updating registration caps for ${category}:`, updateError);
      return false;
    }

    console.log(`Successfully ${isVerification ? 'incremented' : 'decremented'} ${category} registration count to ${newCount}`);
    return true;
  } catch (error) {
    console.error(`Error in updateRegistrationCapsCount for ${category}:`, error);
    return false;
  }
}

/**
 * Handle combined updates for private delegate verification/rejection
 * @param committeePreferences - Array of committee preferences
 * @param isVerification - true if verifying, false if unverifying
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function handlePrivateDelegateUpdates(
  committeePreferences: string[], 
  isVerification: boolean
): Promise<boolean> {
  // Update committee count
  const committeeUpdateSuccess = await handlePrivateDelegateCommitteeCount(
    committeePreferences, 
    isVerification
  );
  
  // Update registration caps for delegates category
  const capsUpdateSuccess = await updateRegistrationCapsCount('delegates', isVerification);
  
  // Log results
  if (!committeeUpdateSuccess) {
    console.warn('Failed to update committee count for private delegate');
  }
  if (!capsUpdateSuccess) {
    console.warn('Failed to update delegates registration caps for private delegate');
  }
  
  // Return true if at least one update succeeded
  return committeeUpdateSuccess || capsUpdateSuccess;
}

/**
 * Handle combined updates for delegation member verification/rejection
 * @param committeePreference - The committee preference of the delegation member
 * @param isVerification - true if verifying, false if unverifying
 * @param isHeadDelegate - true if this is a head delegate, false otherwise
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function handleDelegationMemberUpdates(
  committeePreference: string, 
  isVerification: boolean,
  isHeadDelegate: boolean = false
): Promise<boolean> {
  // Update committee count
  const committeeUpdateSuccess = await handleDelegationMemberCommitteeCount(
    committeePreference, 
    isVerification
  );
  
  // Update registration caps for delegates category
  const capsUpdateSuccess = await updateRegistrationCapsCount('delegates', isVerification);
  
  // Log results
  if (!committeeUpdateSuccess) {
    console.warn('Failed to update committee count for delegation member');
  }
  if (!capsUpdateSuccess) {
    console.warn('Failed to update delegates registration caps for delegation member');
  }
  
  // Log head delegate verification
  if (isHeadDelegate && isVerification) {
    console.log('Head delegate verified - committee and delegates registration caps updated');
  }
  
  // Return true if at least one update succeeded
  return committeeUpdateSuccess || capsUpdateSuccess;
}
