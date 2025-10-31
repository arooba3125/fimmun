import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminEntry() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <>
      <Head>
        <title>FIMMUN Admin</title>
        <meta name="description" content="FIMMUN Administration" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-4">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold mb-2">FIMMUN Admin</h2>
          <p className="text-blue-200">Redirecting to dashboard…</p>
        </div>
      </div>
    </>
  );
}