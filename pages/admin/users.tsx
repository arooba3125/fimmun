import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminManagement() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard - user management is disabled
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <>
      <Head>
        <title>Admin Management - FIMMUN Admin</title>
        <meta name="description" content="Admin user management is disabled" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    </>
  );
}
