import { getSupabaseServerClient } from '@/lib/supabaseServer';

export default async function AdminHomePage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <form action="/admin/logout" method="post">
          <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-black">Logout</button>
        </form>
      </div>
      <div className="bg-white rounded border p-4">
        <p>Welcome {user?.email}</p>
      </div>
    </main>
  );
}


