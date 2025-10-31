import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const redirectedFrom = router.query.redirectedFrom;
    if (redirectedFrom === '/admin') {
      // no-op; can be used for UI message
    }
  }, [router.query]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInError) {
        setError(signInError.message);
        setIsPending(false);
        return;
      }

      if (!data.user) {
        setError('Login failed: No user data returned');
        setIsPending(false);
        return;
      }

      // Email verification check removed - user can login directly

      // Note: Admin email check is done server-side in middleware
      // Client-side check removed to prevent exposing admin email in client bundle

      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify session was created
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Session creation failed. Please try again.');
        setIsPending(false);
        return;
      }

      // Clear sensitive data from memory
      setEmail('');
      setPassword('');
      
      router.replace('/admin');
    } catch {
      console.error('Login error');
      setError('An unexpected error occurred');
      // Clear sensitive data even on error
      setPassword('');
      setIsPending(false);
    }
  };


  return (
    <>
      <Head>
        <title>Admin Login - FIMMUN 2025</title>
        <meta name="description" content="FIMMUN Admin Login" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-semibold mb-6 text-center">Admin Login</h1>
          <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                autoComplete="off"
                className="w-full border rounded px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full border rounded px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                <p className="font-medium">Error:</p>
                <p>{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// Prevent caching of login page
export const getServerSideProps: GetServerSideProps = async (context) => {
  context.res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  );
  context.res.setHeader('Pragma', 'no-cache');
  context.res.setHeader('Expires', '0');
  context.res.setHeader('Surrogate-Control', 'no-store');
  
  return {
    props: {},
  };
};
