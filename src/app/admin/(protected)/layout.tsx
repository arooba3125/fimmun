import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  let userEmail: string | null = null;
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/admin/login');
    }
    userEmail = user.email ?? null;
  } catch {
    redirect('/admin/login');
  }

  // Use only server-side env var to prevent exposing admin email
  const adminEmail = process.env.ADMIN_EMAIL as string | undefined;
  if (adminEmail && userEmail && userEmail !== adminEmail) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}


