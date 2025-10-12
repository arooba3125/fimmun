import { NextApiRequest, NextApiResponse } from 'next';
import { getCommitteeRegistrationCaps } from '../../../lib/committeeRegistrationCaps';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const caps = await getCommitteeRegistrationCaps();

    return res.status(200).json({
      success: true,
      committees: caps.map(cap => ({
        name: cap.committee_name,
        nameLength: cap.committee_name.length,
        hasTrailingSpace: cap.committee_name !== cap.committee_name.trim(),
        maxCapacity: cap.max_capacity,
        currentCount: cap.current_count
      })),
      total: caps.length
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch committees',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

