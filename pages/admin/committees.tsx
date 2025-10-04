import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface Committee {
  id: string;
  name: string;
  short_name: string | null;
  topic: string | null;
  description: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null;
  max_delegates: number;
  current_delegates: number;
  chair_name: string | null;
  chair_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminCommittees() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setShowAddModal] = useState(false);
  const [, setEditingCommittee] = useState<Committee | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchCommittees();
  }, [router]);

  const fetchCommittees = async () => {
    try {
      const response = await fetch('/api/committees/manage');
      const data = await response.json();
      
      if (data.success) {
        setCommittees(data.committees);
      } else {
        console.error('Failed to fetch committees:', data.error);
        setCommittees([]);
      }
    } catch (error) {
      console.error('Error fetching committees:', error);
      setCommittees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this committee?')) return;
    
    try {
      const response = await fetch('/api/committees/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const data = await response.json();
      if (data.success) {
        fetchCommittees();
      } else {
        alert('Failed to delete committee: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting committee:', error);
      alert('Failed to delete committee');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading committees...</p>
      </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Committee Management - FIMMUN Admin</title>
        <meta name="description" content="Manage FIMMUN committees" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Committee Management</h1>
                  <p className="text-sm text-gray-500">Manage committees and their details</p>
                </div>
          </div>
                      <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled
                title="Feature coming soon"
              >
                Add Committee
                    </button>
            </div>
              </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Committees ({committees.length})</h3>

            {committees.length === 0 ? (
                <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No committees</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new committee.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {committees.map((committee) => (
                    <div key={committee.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="flex items-start justify-between">
                      <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{committee.name}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              committee.difficulty_level === 'advanced' 
                                ? 'bg-red-100 text-red-800' 
                                : committee.difficulty_level === 'intermediate'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {committee.difficulty_level || 'Not Set'}
                        </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              committee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {committee.is_active ? 'Active' : 'Inactive'}
                        </span>
                          </div>
                          {committee.topic && (
                            <p className="text-sm text-gray-600 mb-2">Topic: {committee.topic}</p>
                          )}
                    {committee.chair_name && (
                            <p className="text-sm text-gray-600 mb-2">Chair: {committee.chair_name}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            Delegates: {committee.current_delegates}/{committee.max_delegates}
                          </p>
                  </div>
                        <div className="flex items-center gap-2">
                    <button
                            onClick={() => setEditingCommittee(committee)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            disabled
                            title="Feature coming soon"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                    </button>
                          <button
                            onClick={() => handleDelete(committee.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                    </button>
            </div>
                                          </div>
                  </div>
                  ))}
                    </div>                    
              )}
                    </div>
              </div>
        </main>
      </div>
    </>
  );
}