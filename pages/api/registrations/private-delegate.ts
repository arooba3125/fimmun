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
    
    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
    const whatsapp = Array.isArray(fields.whatsapp) ? fields.whatsapp[0] : fields.whatsapp;
    const cnic = Array.isArray(fields.cnic) ? fields.cnic[0] : fields.cnic;
    const institution = Array.isArray(fields.institution) ? fields.institution[0] : fields.institution;
    const mun_experience = Array.isArray(fields.mun_experience) ? fields.mun_experience[0] : fields.mun_experience;
    const referral_source_id = Array.isArray(fields.referral_source_id) ? fields.referral_source_id[0] : fields.referral_source_id;
    // Handle both committee_preference (singular) and committee_preferences (plural)
    let committee_preferences = [];
    
    if (fields.committee_preferences) {
      // If committee_preferences is provided (array format)
      committee_preferences = Array.isArray(fields.committee_preferences) 
        ? JSON.parse(fields.committee_preferences[0] || '[]') 
        : JSON.parse(fields.committee_preferences || '[]');
    } else if (fields.committee_preference) {
      // If committee_preference is provided (single value)
      const committee_preference = Array.isArray(fields.committee_preference) 
        ? fields.committee_preference[0] 
        : fields.committee_preference;
      committee_preferences = [committee_preference]; // Convert to array
    }

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
    if (!name || !email || !whatsapp || !cnic || !institution || !committee_preferences || !referral_source_id) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if email already exists
    const { data: existingDelegate } = await supabaseAdmin
      .from('private_delegates')
      .select('email')
      .eq('email', email)
      .single();

    if (existingDelegate) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check registration cap
    const { data: capData } = await supabaseAdmin
      .from('registration_caps')
      .select('current_count, max_count')
      .eq('category', 'delegates')
      .single();

    if (capData && capData.current_count >= capData.max_count) {
      return res.status(400).json({
        success: false,
        message: 'Registration cap reached for delegates'
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Create registration
    const { data: newDelegate, error } = await supabaseAdmin
      .from('private_delegates')
      .insert({
        name,
        email,
        whatsapp,
        cnic,
        institution,
        mun_experience: mun_experience || null,
        committee_preferences,
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
      .eq('category', 'delegates');

    return res.status(201).json({
      success: true,
      message: 'Registration submitted successfully',
      verification_code: verificationCode,
      registration: {
        id: newDelegate.id,
        name: newDelegate.name,
        email: newDelegate.email,
        status: newDelegate.status
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
