import { NextApiRequest, NextApiResponse } from 'next';
import { 
  getCommitteeRegistrationCaps, 
  updateCommitteeRegistrationCaps, 
  resetCommitteeRegistrationCounts
} from '../../../lib/committeeRegistrationCaps';
import { requireAdminAuth } from '../../../lib/auth-helpers';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get current committee registration caps
    try {
      const caps = await getCommitteeRegistrationCaps();

      return res.status(200).json({
        success: true,
        caps
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch committee registration caps',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    // Update committee registration caps
    const { caps } = req.body;

    if (!caps || !Array.isArray(caps)) {
      return res.status(400).json({ 
        message: 'Caps array is required' 
      });
    }

    try {
      const success = await updateCommitteeRegistrationCaps(caps);

      if (!success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update committee registration caps'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Committee registration caps updated successfully!'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update committee registration caps',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'POST') {
    // Reset committee registration counts
    try {
      const success = await resetCommitteeRegistrationCounts();

      if (!success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to reset committee registration counts'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Committee registration counts reset successfully!'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to reset committee registration counts',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

export default requireAdminAuth(handler);
