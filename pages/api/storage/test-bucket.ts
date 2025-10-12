import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = createAdminClient();
    
    // Test 1: List all buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    // Test 2: Check if payment-proofs bucket exists
    const paymentProofsBucket = buckets?.find(bucket => bucket.id === 'payment-proofs');
    
    // Test 3: Try to list files in payment-proofs bucket (if it exists)
    let filesInBucket = null;
    let filesError = null;
    
    if (paymentProofsBucket) {
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('payment-proofs')
        .list('payment_proofs', {
          limit: 10
        });
      
      filesInBucket = files;
      filesError = listError;
    }

    // Test 4: Try to create a test file (if bucket exists)
    let uploadTest = null;
    if (paymentProofsBucket) {
      const testContent = 'test file content';
      const testFileName = `test_${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('payment-proofs')
        .upload(`payment_proofs/${testFileName}`, testContent, {
          contentType: 'text/plain'
        });
      
      uploadTest = {
        success: !uploadError,
        error: uploadError?.message,
        data: uploadData
      };
      
      // Clean up test file
      if (uploadData?.path) {
        await supabaseAdmin.storage
          .from('payment-proofs')
          .remove([uploadData.path]);
      }
    }

    return res.status(200).json({
      success: true,
      debug: {
        serviceRoleConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        bucketsTest: {
          success: !bucketsError,
          error: bucketsError?.message,
          buckets: buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })) || []
        },
        paymentProofsBucket: {
          exists: !!paymentProofsBucket,
          bucket: paymentProofsBucket
        },
        filesTest: {
          success: !filesError,
          error: filesError?.message,
          files: filesInBucket || []
        },
        uploadTest
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Storage test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
