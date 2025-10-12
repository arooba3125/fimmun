import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../../lib/supabaseClient';

const COMMITTEES = [
  'Pakistan National Assembly',
  'Special Crisis Committee',
  'United Nations Security Council',
  'United Nations Human Rights Council',
  'Disarmament and International Security Committee',
  'Commission on the Status of Women',
  'Organization of Islamic Cooperation'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { delegationSerial } = req.query;
  
  console.log('Available committees request for delegation serial:', delegationSerial);
  
  if (!delegationSerial || typeof delegationSerial !== 'string') {
    console.log('Invalid delegation serial format:', delegationSerial);
    return res.status(400).json({
      success: false,
      message: 'Delegation serial number is required'
    });
  }

  const supabaseAdmin = createAdminClient();

  try {
    // Find delegation by serial
    console.log('Searching for delegation with serial:', delegationSerial);
    const { data: delegation, error: delegationError } = await supabaseAdmin
      .from('delegations')
      .select('id, delegation_name, status, committee_preferences')
      .eq('delegation_serial', delegationSerial)
      .single();

    if (delegationError) {
      console.error('Delegation query error:', delegationError);
      return res.status(400).json({
        success: false,
        message: 'Invalid delegation serial number',
        error_details: delegationError.message
      });
    }

    if (!delegation) {
      console.log('No delegation found with serial:', delegationSerial);
      return res.status(400).json({
        success: false,
        message: 'Invalid delegation serial number'
      });
    }

    console.log('Found delegation:', delegation);

    if (delegation.status !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Delegation is not yet verified'
      });
    }

    // Check delegation capacity (max 7 members per delegation)
    const { data: existingMembers, error: membersError } = await supabaseAdmin
      .from('delegation_members')
      .select('id')
      .eq('delegation_id', delegation.id);

    if (membersError) {
      console.error('Error checking delegation members:', membersError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check delegation capacity'
      });
    }

    if (existingMembers && existingMembers.length >= 7) {
      return res.status(200).json({
        success: true,
        available_committees: [],
        message: 'Delegation has reached maximum capacity (7 members)'
      });
    }

    // Get assigned committees for this delegation
    // First check if committee_preference column exists by querying all members
    const { data: allMembers, error: membersQueryError } = await supabaseAdmin
      .from('delegation_members')
      .select('*')
      .eq('delegation_id', delegation.id);

    if (membersQueryError) {
      console.error('Error checking delegation members:', membersQueryError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check delegation members'
      });
    }

    console.log(`Found ${allMembers?.length || 0} existing members for delegation ${delegationSerial}`);
    console.log('All members data:', JSON.stringify(allMembers, null, 2));

    // Check if committee_preference column exists by looking at the first member's data
    let assignedCommitteeNames: string[] = [];
    
    if (allMembers && allMembers.length > 0) {
      const firstMember = allMembers[0];
      console.log('First member data:', JSON.stringify(firstMember, null, 2));
      
      if ('committee_preference' in firstMember) {
        console.log('committee_preference column exists');
        // Column exists, filter out assigned committees
        assignedCommitteeNames = allMembers
          .filter(member => member.committee_preference)
          .map(member => member.committee_preference);
        console.log('Assigned committees:', assignedCommitteeNames);
      } else {
        console.log('committee_preference column does NOT exist');
      }
      // If column doesn't exist, assignedCommitteeNames remains empty array
    } else {
      console.log('No existing members found');
    }

    // Filter committees based on head delegate committee and assigned committees
    let availableCommittees: string[] = [];
    
    const headDelegateCommittee = delegation.committee_preferences && delegation.committee_preferences.length > 0 
      ? delegation.committee_preferences[0] 
      : null;
    
    if (headDelegateCommittee) {
      console.log('Head delegate committee:', headDelegateCommittee);
      console.log('Assigned committees in this delegation:', assignedCommitteeNames);
      
      // Show all committees except head delegate's committee and already assigned committees
      availableCommittees = COMMITTEES.filter(committee => 
        committee !== headDelegateCommittee && !assignedCommitteeNames.includes(committee)
      );
      
      console.log('Available committees for members (excluding head delegate committee):', availableCommittees);
    } else {
      console.log('No head delegate committee set - showing all unassigned committees');
      // If no head delegate committee, show all unassigned committees
      availableCommittees = COMMITTEES.filter(committee => !assignedCommitteeNames.includes(committee));
    }
    
    console.log('Available committees:', availableCommittees);

    return res.status(200).json({
      success: true,
      available_committees: availableCommittees,
      delegation_info: {
        name: delegation.delegation_name,
        current_members: existingMembers?.length || 0,
        max_capacity: 7,
        head_delegate_committee: headDelegateCommittee
      }
    });

  } catch (error) {
    console.error('Available committees check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
