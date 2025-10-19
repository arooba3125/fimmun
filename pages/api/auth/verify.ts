import { NextApiRequest, NextApiResponse } from 'next';
import { verifyTokenWithBlacklist } from '../../../lib/authMiddleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const verification = await verifyTokenWithBlacklist(token);
  
  if (!verification.valid) {
    return res.status(401).json({ message: verification.error });
  }

  res.status(200).json({
    success: true,
    user: {
      id: verification.decoded!.id,
      email: verification.decoded!.email,
      role: verification.decoded!.role
    }
  });
}