import { NextApiRequest, NextApiResponse } from 'next';
import { manuallyAdjustCommitteeCount } from '../../../lib/committeeRegistrationCaps';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  const { committeeName, adjustment, reason } = req.body;

  console.log('Manual adjustment request:', { committeeName, adjustment, reason });

  // Validation
  if (!committeeName || typeof committeeName !== 'string') {
    console.error('Validation failed: Committee name is required');
    return res.status(400).json({ 
      success: false,
      error: 'Committee name is required' 
    });
  }

  if (typeof adjustment !== 'number' || adjustment === 0) {
    console.error('Validation failed: Adjustment must be a non-zero number');
    return res.status(400).json({ 
      success: false,
      error: 'Adjustment must be a non-zero number' 
    });
  }

  try {
    const result = await manuallyAdjustCommitteeCount(committeeName, adjustment);

    if (!result.success) {
      console.error('Manual adjustment failed:', result.error);
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to adjust committee count'
      });
    }

    // Log the manual adjustment (optional but recommended for audit trail)
    console.log(`✓ Manual adjustment successful for ${committeeName}: ${adjustment > 0 ? '+' : ''}${adjustment} (New count: ${result.newCount})`);
    if (reason) {
      console.log(`  Reason: ${reason}`);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully adjusted ${committeeName} count by ${adjustment}`,
      newCount: result.newCount
    });

  } catch (error) {
    console.error('Error in manual committee adjustment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to adjust committee count',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

