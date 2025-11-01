import { NextApiRequest, NextApiResponse } from 'next';
import { getCommitteeRegistrationCaps } from '../../lib/committeeRegistrationCaps';

/**
 * Public API endpoint to fetch committee registration caps
 * This endpoint is accessible without authentication for public display
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const caps = await getCommitteeRegistrationCaps();

    return res.status(200).json({
      success: true,
      caps
    });

  } catch (error) {
    console.error('Error fetching committee registration caps:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch committee registration caps',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
