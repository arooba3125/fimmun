import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import formidable from 'formidable';
import fs from 'fs';

// Generate verification code
function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate delegation serial number
async function generateDelegationSerial(supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  const { data } = await supabase
    .from('delegations')
    .select('delegation_serial')
    .like('delegation_serial', 'DEL-%')
    .order('created_at', { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastSerial = data[0].delegation_serial;
    const lastNumber = parseInt(lastSerial.split('-')[1]);
    nextNumber = lastNumber + 1;
  }

  return `DEL-${nextNumber.toString().padStart(3, '0')}`;
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
    
    const delegation_name = Array.isArray(fields.delegation_name) ? fields.delegation_name[0] : fields.delegation_name;
    const head_delegate_committee = Array.isArray(fields.head_delegate_committee) 
      ? fields.head_delegate_committee[0] 
      : fields.head_delegate_committee;
    const head_delegate_name = Array.isArray(fields.head_delegate_name) ? fields.head_delegate_name[0] : fields.head_delegate_name;
    const head_delegate_email = Array.isArray(fields.head_delegate_email) ? fields.head_delegate_email[0] : fields.head_delegate_email;
    const head_delegate_whatsapp = Array.isArray(fields.head_delegate_whatsapp) ? fields.head_delegate_whatsapp[0] : fields.head_delegate_whatsapp;
    const head_delegate_cnic = Array.isArray(fields.head_delegate_cnic) ? fields.head_delegate_cnic[0] : fields.head_delegate_cnic;
    const head_delegate_institution = Array.isArray(fields.head_delegate_institution) ? fields.head_delegate_institution[0] : fields.head_delegate_institution;
    const head_delegate_experience = Array.isArray(fields.head_delegate_experience) ? fields.head_delegate_experience[0] : fields.head_delegate_experience;
    const referral_source_id = Array.isArray(fields.referral_source_id) ? fields.referral_source_id[0] : fields.referral_source_id;

    // Handle file upload
    let payment_proof_url = null;
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
    if (!delegation_name || !head_delegate_committee || !head_delegate_name || 
        !head_delegate_email || !head_delegate_whatsapp || !head_delegate_cnic || !head_delegate_institution || !referral_source_id) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate CNIC format (exactly 13 digits)
    if (!head_delegate_cnic || head_delegate_cnic.length !== 13 || !/^\d{13}$/.test(head_delegate_cnic)) {
      return res.status(400).json({
        success: false,
        message: 'CNIC must be exactly 13 digits'
      });
    }

    // Check if delegation name already exists
    const { data: existingDelegation } = await supabaseAdmin
      .from('delegations')
      .select('delegation_name')
      .eq('delegation_name', delegation_name)
      .single();

    if (existingDelegation) {
      return res.status(400).json({
        success: false,
        message: 'Delegation name already exists'
      });
    }

    // Check if head delegate email already exists
    const { data: existingHeadDelegate } = await supabaseAdmin
      .from('delegations')
      .select('head_delegate_email')
      .eq('head_delegate_email', head_delegate_email)
      .single();

    if (existingHeadDelegate) {
      return res.status(400).json({
        success: false,
        message: 'Head delegate email already registered'
      });
    }

    // Check if CNIC already exists across all registration tables
    const cnicChecks = await Promise.all([
      supabaseAdmin.from('alumni').select('cnic').eq('cnic', head_delegate_cnic).maybeSingle(),
      supabaseAdmin.from('delegation_members').select('cnic').eq('cnic', head_delegate_cnic).maybeSingle(),
      supabaseAdmin.from('observers').select('cnic').eq('cnic', head_delegate_cnic).maybeSingle(),
      supabaseAdmin.from('private_delegates').select('cnic').eq('cnic', head_delegate_cnic).maybeSingle(),
      supabaseAdmin.from('delegations').select('cnic').eq('cnic', head_delegate_cnic).maybeSingle()
    ]);

    // Check if any table has this CNIC
    const cnicExists = cnicChecks.some(({ data }) => data !== null);

    if (cnicExists) {
      return res.status(400).json({
        success: false,
        message: 'This CNIC is already registered. Each CNIC can only be registered once.'
      });
    }

    // Generate delegation serial
    const delegationSerial = await generateDelegationSerial(supabaseAdmin);

    console.log('Creating delegation with data:', {
      delegation_name,
      delegation_serial: delegationSerial,
      head_delegate_committee,
      head_delegate_name,
      head_delegate_email
    });

    // Create delegation
    const { data: newDelegation, error } = await supabaseAdmin
      .from('delegations')
      .insert({
        delegation_name,
        delegation_serial: delegationSerial,
        committee_preferences: [head_delegate_committee], // Store as array with single element
        head_delegate_name,
        head_delegate_email,
        head_delegate_whatsapp,
        cnic: head_delegate_cnic,
        head_delegate_institution,
        head_delegate_experience: head_delegate_experience || null,
        payment_proof_url,
        referral_source_id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create delegation',
        details: error.message,
        error_code: error.code,
        error_hint: error.hint
      });
    }

    // Generate verification code for head delegate
    const verificationCode = generateVerificationCode();

    // Create head delegate as a delegation member
    const { error: memberError } = await supabaseAdmin
      .from('delegation_members')
      .insert({
        delegation_id: newDelegation.id,
        delegation_serial: delegationSerial,
        name: head_delegate_name,
        email: head_delegate_email,
        whatsapp: head_delegate_whatsapp,
        cnic: head_delegate_cnic,
        institution: head_delegate_institution,
        mun_experience: head_delegate_experience || null,
        committee_preference: head_delegate_committee,
        payment_proof_url,
        referral_source_id,
        verification_code: verificationCode,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (memberError) {
      console.error('Failed to create head delegate as member:', memberError);
      // Don't fail the entire registration, just log the error
      console.log('Delegation created but head delegate member creation failed');
    }

    return res.status(201).json({
      success: true,
      message: 'Delegation registered successfully',
      delegation_serial: delegationSerial,
      head_delegate_verification_code: verificationCode,
      delegation: {
        id: newDelegation.id,
        delegation_name: newDelegation.delegation_name,
        delegation_serial: newDelegation.delegation_serial,
        status: newDelegation.status
      }
    });

  } catch (error) {
    console.error('Delegation registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
