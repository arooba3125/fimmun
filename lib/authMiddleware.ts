import { NextApiRequest, NextApiResponse } from 'next';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { createAdminClient } from './supabaseClient';

// Helper function to extract token from request
export function getTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Helper function to verify JWT token and check blacklist
export async function verifyTokenWithBlacklist(token: string): Promise<{ valid: boolean; decoded?: JwtPayload; error?: string }> {
  try {
    // First verify the JWT token
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'fallback-secret') as JwtPayload;
    
    // Check if token is blacklisted
    const supabaseAdmin = createAdminClient();
    const { data: blacklistedToken } = await supabaseAdmin
      .from('token_blacklist')
      .select('id')
      .eq('token_jti', decoded.jti || token)
      .single();

    if (blacklistedToken) {
      return { valid: false, error: 'Token has been blacklisted' };
    }

    // Check if there's a force logout entry for this user
    const { data: forceLogout } = await supabaseAdmin
      .from('token_blacklist')
      .select('id')
      .eq('user_id', decoded.id)
      .eq('reason', 'force_logout_all_sessions')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (forceLogout) {
      return { valid: false, error: 'All sessions have been invalidated' };
    }

    return { valid: true, decoded };
  } catch {
    return { valid: false, error: 'Invalid token' };
  }
}

// Middleware function to authenticate admin requests
export async function authenticateAdmin(req: NextApiRequest): Promise<{ success: boolean; user?: JwtPayload; error?: string }> {
  const token = getTokenFromRequest(req);
  
  if (!token) {
    return { success: false, error: 'No token provided' };
  }

  const verification = await verifyTokenWithBlacklist(token);
  
  if (!verification.valid) {
    return { success: false, error: verification.error };
  }

  return { success: true, user: verification.decoded };
}

// Higher-order function to wrap API routes with authentication
export function withAuth(handler: (req: NextApiRequest, res: NextApiResponse, user: JwtPayload) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = await authenticateAdmin(req);
    
    if (!auth.success) {
      return res.status(401).json({ message: auth.error });
    }

    return handler(req, res, auth.user!);
  };
}
