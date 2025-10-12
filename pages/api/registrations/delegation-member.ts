import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import formidable from 'formidable';
import fs from 'fs';

// Generate verification code
function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabaseAdmin = createAdminClient();

  try {
    // Parse form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const delegation_serial = Array.isArray(fields.delegation_serial) ? fields.delegation_serial[0] : fields.delegation_serial;
    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
    const whatsapp = Array.isArray(fields.whatsapp) ? fields.whatsapp[0] : fields.whatsapp;
    const institution = Array.isArray(fields.institution) ? fields.institution[0] : fields.institution;
    const mun_experience = Array.isArray(fields.mun_experience) ? fields.mun_experience[0] : fields.mun_experience;
    const committee_preference = Array.isArray(fields.committee_preference) ? fields.committee_preference[0] : fields.committee_preference;

    // Handle file upload
    let payment_proof_url = '';
    const paymentProofFile = files.payment_proof?.[0];
    
    if (paymentProofFile) {
      // Upload to Supabase Storage
      const fileName = `payment_proofs/${Date.now()}_${paymentProofFile.originalFilename}`;
      const fileBuffer = fs.readFileSync(paymentProofFile.filepath);
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('payment-proofs')
        .upload(fileName, fileBuffer, {
          contentType: paymentProofFile.mimetype || 'application/octet-stream',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload payment proof'
        });
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);
      
      payment_proof_url = urlData.publicUrl;
    }

    // Validation
    if (!delegation_serial || !name || !email || !whatsapp || !institution || !committee_preference) {
      console.error('Validation failed:', {
        delegation_serial: !!delegation_serial,
        name: !!name,
        email: !!email,
        whatsapp: !!whatsapp,
        institution: !!institution,
        committee_preference: !!committee_preference
      });
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Additional validation for field lengths and formats
    if (email && !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (name && name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }

    // Find delegation by serial
    console.log('Searching for delegation with serial:', delegation_serial);
    const { data: delegation, error: delegationError } = await supabaseAdmin
      .from('delegations')
      .select('id, delegation_name, status, committee_preferences')
      .eq('delegation_serial', delegation_serial)
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
      console.log('No delegation found with serial:', delegation_serial);
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

    // Check if the selected committee is the head delegate's committee
    const headDelegateCommittee = delegation.committee_preferences && delegation.committee_preferences.length > 0 
      ? delegation.committee_preferences[0] 
      : null;
    
    if (headDelegateCommittee && committee_preference === headDelegateCommittee) {
      return res.status(400).json({
        success: false,
        message: `This committee is already assigned to the head delegate. Please select a different committee.`
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
      return res.status(400).json({
        success: false,
        message: 'Delegation has reached maximum capacity (7 members)'
      });
    }

    // Check if committee is already assigned to another member in this delegation
    // First check if committee_preference column exists
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

    // Check if committee_preference column exists and if there are conflicts
    console.log(`Checking committee conflicts for delegation ${delegation.id}`);
    console.log('All existing members:', JSON.stringify(allMembers, null, 2));
    
    if (allMembers && allMembers.length > 0) {
      const firstMember = allMembers[0];
      console.log('First member data:', JSON.stringify(firstMember, null, 2));
      
      if ('committee_preference' in firstMember) {
        console.log('committee_preference column exists, checking for conflicts');
        // Column exists, check for conflicts
        const committeeConflict = allMembers.filter(member => 
          member.committee_preference === committee_preference
        );
        
        console.log(`Committee conflicts for "${committee_preference}":`, committeeConflict.length);

        if (committeeConflict.length > 0) {
          console.log('Committee conflict found:', committeeConflict);
          return res.status(400).json({
            success: false,
            message: `Committee "${committee_preference}" is already assigned to another member in this delegation`
          });
        }
      } else {
        console.log('committee_preference column does NOT exist, no conflicts possible');
      }
      // If column doesn't exist, no conflicts possible, continue
    } else {
      console.log('No existing members, no conflicts possible');
    }

    // Check if email already exists in delegation members
    const { data: existingMember } = await supabaseAdmin
      .from('delegation_members')
      .select('email')
      .eq('email', email)
      .single();

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered in a delegation'
      });
    }

    // Check if email exists in private delegates
    const { data: existingPrivateDelegate } = await supabaseAdmin
      .from('private_delegates')
      .select('email')
      .eq('email', email)
      .single();

    if (existingPrivateDelegate) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered as private delegate'
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Create delegation member
    // Check if committee_preference column exists before including it in insert
    const insertData: Record<string, string | string[]> = {
      delegation_id: delegation.id,
      delegation_serial: delegation_serial,
      name,
      email,
      whatsapp,
      institution,
      mun_experience: mun_experience || '',
      payment_proof_url,
      verification_code: verificationCode,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Only include committee_preference if the column exists
    if (allMembers && allMembers.length > 0) {
      const firstMember = allMembers[0];
      if ('committee_preference' in firstMember) {
        insertData.committee_preference = committee_preference;
      }
    } else {
      // If no existing members, try to include committee_preference
      // The database will ignore it if the column doesn't exist
      insertData.committee_preference = committee_preference;
    }

    console.log('Inserting delegation member with data:', JSON.stringify(insertData, null, 2));
    
    // Validate all required fields are present and not empty
    const requiredFields = ['delegation_id', 'delegation_serial', 'name', 'email', 'whatsapp', 'institution', 'verification_code'];
    const missingFields = requiredFields.filter(field => !insertData[field] || insertData[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const { data: newMember, error } = await supabaseAdmin
      .from('delegation_members')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // If error is related to committee_preference column, try without it
      if (error.message && error.message.includes('committee_preference')) {
        console.log('Retrying without committee_preference column...');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { committee_preference, ...insertDataWithoutCommittee } = insertData;
        
        const { data: retryMember, error: retryError } = await supabaseAdmin
          .from('delegation_members')
          .insert(insertDataWithoutCommittee)
          .select()
          .single();
          
        if (retryError) {
          console.error('Retry also failed:', retryError);
          return res.status(500).json({
            success: false,
            message: 'Failed to create delegation member registration',
            details: retryError.message,
            error_code: retryError.code,
            error_hint: retryError.hint
          });
        }
        
        // Success on retry
        return res.status(201).json({
          success: true,
          message: 'Delegation member registration submitted successfully (committee assignment not available)',
          verification_code: verificationCode,
          registration: {
            id: retryMember.id,
            name: retryMember.name,
            email: retryMember.email,
            delegation_name: delegation.delegation_name,
            status: retryMember.status
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create delegation member registration',
        details: error.message,
        error_code: error.code,
        error_hint: error.hint
      });
    }

    console.log('Successfully created delegation member:', JSON.stringify(newMember, null, 2));

    return res.status(201).json({
      success: true,
      message: 'Delegation member registration submitted successfully',
      verification_code: verificationCode,
      registration: {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        delegation_name: delegation.delegation_name,
        status: newMember.status,
        committee_preference: newMember.committee_preference || 'Not assigned'
      }
    });

  } catch (error) {
    console.error('Delegation member registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
