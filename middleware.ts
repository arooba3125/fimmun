import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page itself - but add cache prevention headers
  if (pathname.startsWith('/admin/login')) {
    const response = NextResponse.next();
    // Prevent caching of login page
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    return response;
  }

  const response = NextResponse.next();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    // Use only server-side env var to prevent exposing admin email
    const adminEmail = process.env.ADMIN_EMAIL as string | undefined;

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      } as any,
    });

    const { data: { user } } = await supabase.auth.getUser();

  // If no user, redirect to login
    if (!user) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(url);
    }

    // Restrict to a single allowed email
    if (adminEmail && user.email !== adminEmail) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch {
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin/login',
    '/admin/logout',
  ],
};


