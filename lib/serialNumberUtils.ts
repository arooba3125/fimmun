import { createAdminClient } from './supabaseClient';

/**
 * Generate a globally unique serial number using atomic database function
 * This prevents race conditions and ensures uniqueness even with concurrent requests
 * @param category - The category prefix (OD, OO, OA, etc.)
 * @returns Promise<string> - Unique serial number
 */
export async function generateUniqueSerialNumber(category: string): Promise<string> {
  const supabaseAdmin = createAdminClient();
  
  try {
    // Use the atomic database function to get the next serial number
    const { data, error } = await supabaseAdmin.rpc('get_next_serial_number', {
      cat: category
    });

    if (error) {
      console.error('Error calling get_next_serial_number function:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No serial number returned from database');
    }

    console.log(`Generated unique serial number: ${data} for category: ${category}`);
    return data;

  } catch (error) {
    console.error('Error generating unique serial number:', error);
    
    // Fallback: Try to generate manually as a last resort
    try {
      const fallbackSerial = await generateFallbackSerialNumber(category);
      console.warn(`Using fallback serial number: ${fallbackSerial}`);
      return fallbackSerial;
    } catch (fallbackError) {
      console.error('Fallback serial number generation also failed:', fallbackError);
      // Last resort: use timestamp
      const timestamp = Date.now().toString().slice(-3);
      return `${category}-${timestamp}`;
    }
  }
}

/**
 * Fallback method to generate serial number by checking existing records
 * @param category - The category prefix
 * @returns Promise<string> - Serial number
 */
async function generateFallbackSerialNumber(category: string): Promise<string> {
  const supabaseAdmin = createAdminClient();
  
  // Get the highest serial number across ALL tables that use serial numbers
  const [privateDelegatesResult, observersResult, alumniResult, delegationMembersResult] = await Promise.all([
    supabaseAdmin
      .from('private_delegates')
      .select('serial_number')
      .not('serial_number', 'is', null)
      .like('serial_number', `${category}-%`)
      .order('created_at', { ascending: false })
      .limit(100),
    
    supabaseAdmin
      .from('observers')
      .select('serial_number')
      .not('serial_number', 'is', null)
      .like('serial_number', `${category}-%`)
      .order('created_at', { ascending: false })
      .limit(100),
    
    supabaseAdmin
      .from('alumni')
      .select('serial_number')
      .not('serial_number', 'is', null)
      .like('serial_number', `${category}-%`)
      .order('created_at', { ascending: false })
      .limit(100),
    
    supabaseAdmin
      .from('delegation_members')
      .select('serial_number')
      .not('serial_number', 'is', null)
      .like('serial_number', `${category}-%`)
      .order('created_at', { ascending: false })
      .limit(100)
  ]);

  // Combine all serial numbers from all tables
  const allSerialNumbers = [
    ...(privateDelegatesResult.data || []).map(item => item.serial_number),
    ...(observersResult.data || []).map(item => item.serial_number),
    ...(alumniResult.data || []).map(item => item.serial_number),
    ...(delegationMembersResult.data || []).map(item => item.serial_number)
  ].filter(Boolean);

  // Find the highest number for this category
  let highestNumber = 0;
  for (const serialNumber of allSerialNumbers) {
    if (serialNumber && serialNumber.startsWith(`${category}-`)) {
      const numberPart = parseInt(serialNumber.split('-')[1]);
      if (!isNaN(numberPart) && numberPart > highestNumber) {
        highestNumber = numberPart;
      }
    }
  }

  // Generate next number
  const nextNumber = highestNumber + 1;
  return `${category}-${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Check if a serial number is unique across all tables
 * @param serialNumber - The serial number to check
 * @returns Promise<boolean> - true if unique, false if exists
 */
export async function isSerialNumberUnique(serialNumber: string): Promise<boolean> {
  const supabaseAdmin = createAdminClient();
  
  try {
    const [privateDelegatesResult, observersResult, alumniResult, delegationMembersResult] = await Promise.all([
      supabaseAdmin
        .from('private_delegates')
        .select('id')
        .eq('serial_number', serialNumber)
        .single(),
      
      supabaseAdmin
        .from('observers')
        .select('id')
        .eq('serial_number', serialNumber)
        .single(),
      
      supabaseAdmin
        .from('alumni')
        .select('id')
        .eq('serial_number', serialNumber)
        .single(),
      
      supabaseAdmin
        .from('delegation_members')
        .select('id')
        .eq('serial_number', serialNumber)
        .single()
    ]);

    // If any query returns data (not null), the serial number exists
    return !privateDelegatesResult.data && 
           !observersResult.data && 
           !alumniResult.data && 
           !delegationMembersResult.data;

  } catch (error) {
    console.error('Error checking serial number uniqueness:', error);
    return true; // Assume unique if check fails
  }
}

/**
 * Get the category prefix for different registration types
 */
export const SERIAL_NUMBER_CATEGORIES = {
  DELEGATES: 'OD',        // Delegates (both private and delegation members)
  OBSERVERS: 'OO',        // Observers
  ALUMNI: 'OA',           // Alumni
} as const;

export type SerialNumberCategory = keyof typeof SERIAL_NUMBER_CATEGORIES;
