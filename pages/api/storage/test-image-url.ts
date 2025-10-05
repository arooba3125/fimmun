import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = createAdminClient();
    
    // Test 1: List files in the payment-proofs bucket
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('payment-proofs')
      .list('payment_proofs', {
        limit: 10
      });

    if (listError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to list files',
        details: listError.message
      });
    }

    // Test 2: Generate public URLs for existing files
    const fileTests = [];
    if (files && files.length > 0) {
      for (const file of files.slice(0, 3)) { // Test first 3 files
        const filePath = `payment_proofs/${file.name}`;
        
        // Generate public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('payment-proofs')
          .getPublicUrl(filePath);

        // Test if the URL is accessible
        let urlAccessible = false;
        let urlError = null;
        
        try {
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          urlAccessible = response.ok;
          if (!response.ok) {
            urlError = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (error) {
          urlError = error instanceof Error ? error.message : 'Unknown error';
        }

        fileTests.push({
          fileName: file.name,
          filePath,
          publicUrl: urlData.publicUrl,
          urlAccessible,
          urlError,
          fileSize: file.metadata?.size,
          contentType: file.metadata?.mimetype
        });
      }
    }

    // Test 3: Check bucket configuration
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    const paymentProofsBucket = buckets?.find(bucket => bucket.id === 'payment-proofs');

    return res.status(200).json({
      success: true,
      debug: {
        bucketConfig: {
          exists: !!paymentProofsBucket,
          public: paymentProofsBucket?.public,
          fileSizeLimit: paymentProofsBucket?.file_size_limit,
          allowedMimeTypes: paymentProofsBucket?.allowed_mime_types
        },
        filesList: {
          totalFiles: files?.length || 0,
          files: files?.map(f => ({
            name: f.name,
            size: f.metadata?.size,
            mimetype: f.metadata?.mimetype,
            updated: f.updated_at
          })) || []
        },
        urlTests: fileTests
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Image URL test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
