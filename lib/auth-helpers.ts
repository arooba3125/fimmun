import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';

/**
 * Verify if the current user is authenticated and is an admin
 * For use in API routes (Pages Router)
 */
export async function verifyAdminAuth(req: NextApiRequest): Promise<{
  isAuthenticated: boolean;
  user?: { id: string; email: string };
  error?: string;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    // Use only server-side env var to prevent exposing admin email in client bundle
    const adminEmail = process.env.ADMIN_EMAIL as string | undefined;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        isAuthenticated: false,
        error: 'Server configuration error'
      };
    }

    // Get cookies from request
    const cookieHeader = req.headers.cookie || '';
    const cookiesMap = new Map<string, string>();
    
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...valueParts] = cookie.trim().split('=');
      if (name && valueParts.length > 0) {
        cookiesMap.set(name.trim(), valueParts.join('='));
      }
    });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookiesMap.get(name) || undefined;
        },
        set() {
          // Not needed for auth verification
        },
        remove() {
          // Not needed for auth verification
        },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        isAuthenticated: false,
        error: 'Not authenticated'
      };
    }

    // Check if user is the allowed admin
    if (adminEmail && user.email !== adminEmail) {
      return {
        isAuthenticated: false,
        error: 'Unauthorized - admin access only'
      };
    }

    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email || ''
      }
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      isAuthenticated: false,
      error: 'Authentication check failed'
    };
  }
}

/**
 * Middleware wrapper for API routes to require admin authentication
 */
export function requireAdminAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string }) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authResult = await verifyAdminAuth(req);

    if (!authResult.isAuthenticated || !authResult.user) {
      return res.status(401).json({
        success: false,
        error: authResult.error || 'Authentication required'
      });
    }

    return handler(req, res, authResult.user);
  };
}

