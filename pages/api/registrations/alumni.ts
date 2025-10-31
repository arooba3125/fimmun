import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import formidable from 'formidable';
import fs from 'fs';
import { validateFileUpload } from '../../../lib/file-upload-validation';

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
    
    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
    const whatsapp = Array.isArray(fields.whatsapp) ? fields.whatsapp[0] : fields.whatsapp;
    const cnic = Array.isArray(fields.cnic) ? fields.cnic[0] : fields.cnic;
    const batch = Array.isArray(fields.batch) ? fields.batch[0] : fields.batch;
    const referral_source_id = Array.isArray(fields.referral_source_id) ? fields.referral_source_id[0] : fields.referral_source_id;

    // Handle file upload with validation
    let payment_proof_url = null;
    const paymentProofFile = files.payment_proof?.[0];
    
    if (paymentProofFile) {
      // Validate file before processing
      const validation = validateFileUpload(paymentProofFile);
      if (!validation.valid) {
        // Clean up uploaded file
        try {
          fs.unlinkSync(paymentProofFile.filepath);
        } catch {
          // Ignore cleanup errors
        }
        return res.status(400).json({
          success: false,
          message: validation.error || 'Invalid file'
        });
      }

      // Sanitize filename to prevent path traversal attacks
      const sanitizedFilename = paymentProofFile.originalFilename
        ?.replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 100) || 'payment_proof';
      
      // Upload to Supabase Storage
      const fileName = `payment_proofs/${Date.now()}_${sanitizedFilename}`;
      const fileBuffer = fs.readFileSync(paymentProofFile.filepath);
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('payment-proofs')
        .upload(fileName, fileBuffer, {
          contentType: paymentProofFile.mimetype || 'application/octet-stream',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Clean up uploaded file
        try {
          fs.unlinkSync(paymentProofFile.filepath);
        } catch {
          // Ignore cleanup errors
        }
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
    if (!name || !email || !whatsapp || !cnic || !batch || !referral_source_id) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate CNIC format (exactly 13 digits)
    if (!cnic || cnic.length !== 13 || !/^\d{13}$/.test(cnic)) {
      return res.status(400).json({
        success: false,
        message: 'CNIC must be exactly 13 digits'
      });
    }

    // Check if email already exists
    const { data: existingAlumni } = await supabaseAdmin
      .from('alumni')
      .select('email')
      .eq('email', email)
      .single();

    if (existingAlumni) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check if CNIC already exists across all registration tables
    const [alumniCheck, delegationMembersCheck, observersCheck, privateDelegatesCheck, delegationsCheck] = await Promise.all([
      supabaseAdmin.from('alumni').select('cnic', { count: 'exact', head: true }).eq('cnic', cnic),
      supabaseAdmin.from('delegation_members').select('cnic', { count: 'exact', head: true }).eq('cnic', cnic),
      supabaseAdmin.from('observers').select('cnic', { count: 'exact', head: true }).eq('cnic', cnic),
      supabaseAdmin.from('private_delegates').select('cnic', { count: 'exact', head: true }).eq('cnic', cnic),
      supabaseAdmin.from('delegations').select('cnic', { count: 'exact', head: true }).eq('cnic', cnic)
    ]);

    // Check if any table has this CNIC (count > 0)
    const cnicExists = 
      (alumniCheck.count && alumniCheck.count > 0) ||
      (delegationMembersCheck.count && delegationMembersCheck.count > 0) ||
      (observersCheck.count && observersCheck.count > 0) ||
      (privateDelegatesCheck.count && privateDelegatesCheck.count > 0) ||
      (delegationsCheck.count && delegationsCheck.count > 0);

    if (cnicExists) {
      return res.status(400).json({
        success: false,
        message: 'This CNIC is already registered. Each CNIC can only be registered once.'
      });
    }

    // Check registration cap
    const { data: capData } = await supabaseAdmin
      .from('registration_caps')
      .select('current_count, max_count')
      .eq('category', 'alumni')
      .single();

    if (capData && capData.current_count >= capData.max_count) {
      return res.status(400).json({
        success: false,
        message: 'Registration cap reached for alumni'
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Create registration
    const { data: newAlumni, error } = await supabaseAdmin
      .from('alumni')
      .insert({
        name,
        email,
        whatsapp,
        cnic,
        batch,
        payment_proof_url,
        referral_source_id,
        verification_code: verificationCode,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create registration',
        details: error.message
      });
    }

    // Update registration cap
    await supabaseAdmin
      .from('registration_caps')
      .update({ 
        current_count: capData ? capData.current_count + 1 : 1,
        updated_at: new Date().toISOString()
      })
      .eq('category', 'alumni');

    return res.status(201).json({
      success: true,
      message: 'Registration submitted successfully',
      verification_code: verificationCode,
      registration: {
        id: newAlumni.id,
        name: newAlumni.name,
        email: newAlumni.email,
        status: newAlumni.status
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
