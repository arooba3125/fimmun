import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { createAdminClient } from '../../../lib/supabaseClient';

// Helper function to extract token from request
function getTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Helper function to verify and decode JWT token
function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as jwt.JwtPayload;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from Authorization header
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Check if token is already blacklisted
    const supabaseAdmin = createAdminClient();
    const { data: existingBlacklist } = await supabaseAdmin
      .from('token_blacklist')
      .select('id')
      .eq('token_jti', decoded.jti || token)
      .single();

    if (existingBlacklist) {
      return res.status(200).json({ 
        success: true, 
        message: 'Token already blacklisted' 
      });
    }

    // Add current token to blacklist
    await supabaseAdmin
      .from('token_blacklist')
      .insert({
        token_jti: decoded.jti || token,
        user_id: decoded.id,
        expires_at: new Date((decoded.exp || 0) * 1000).toISOString(),
        reason: 'manual_logout'
      });

    // Get all admin users to blacklist all their tokens
    const { data: adminUsers, error: usersError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email');

    if (usersError) {
      console.error('Error fetching admin users:', usersError);
      return res.status(500).json({ message: 'Error fetching admin users' });
    }

    // Blacklist all tokens for all admin users
    // Note: This is a simplified approach - in a real system, you'd need to track
    // all issued tokens. For now, we'll blacklist based on user ID and timestamp
    const blacklistPromises = adminUsers.map(async (user) => {
      // Create a generic blacklist entry for this user
      // This will invalidate any future token checks for this user
      await supabaseAdmin
        .from('token_blacklist')
        .insert({
          token_jti: `user_${user.id}_${Date.now()}`,
          user_id: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          reason: 'force_logout_all_sessions'
        });
    });

    await Promise.all(blacklistPromises);

    res.status(200).json({
      success: true,
      message: 'All admin sessions have been invalidated. All users will need to log in again.',
      affected_users: adminUsers.length
    });

  } catch (error) {
    console.error('Logout everywhere error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
