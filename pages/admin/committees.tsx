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
  capacity: number;
  current_count: number;
  chair_name: string | null;
  chair_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminCommittees() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 30
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchCommittees();
  }, [router]);

  const fetchCommittees = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
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
      setRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this committee?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Delete token check:', { token: token ? 'present' : 'missing', tokenLength: token?.length });
      
      if (!token) {
        alert('Authentication required. Please log in again.');
        router.push('/admin');
        return;
      }

      const requestHeaders = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      console.log('Delete request headers:', requestHeaders);
      console.log('Delete request body:', { id });

      const response = await fetch('/api/committees/manage', {
        method: 'DELETE',
        headers: requestHeaders,
        body: JSON.stringify({ id })
      });

      const data = await response.json();
      console.log('Delete committee response:', data);
      
      if (data.success) {
        fetchCommittees();
      } else {
        console.error('Delete committee error:', data);
        alert('Failed to delete committee: ' + data.error + (data.details ? '\nDetails: ' + data.details : ''));
      }
    } catch (error) {
      console.error('Error deleting committee:', error);
      alert('Failed to delete committee');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Authentication required. Please log in again.');
        router.push('/admin');
        return;
      }

      const url = '/api/committees/manage';
      const method = editingCommittee ? 'PUT' : 'POST';
      
      // Map frontend fields to database fields
      const body = editingCommittee 
        ? { 
            id: editingCommittee.id, 
            name: formData.name,
            description: formData.description || null,
            capacity: formData.capacity
          }
        : {
            name: formData.name,
            description: formData.description || null,
            capacity: formData.capacity
          };

      console.log('Committee request:', {
        method,
        editingCommittee: editingCommittee?.id,
        body
      });

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      console.log('Committee API response:', data);
      
      if (data.success) {
        setShowAddModal(false);
        setEditingCommittee(null);
        setFormData({
          name: '',
          description: '',
          capacity: 30
        });
        fetchCommittees();
      } else {
        console.error('Committee save error:', data);
        alert('Failed to save committee: ' + data.error + (data.details ? '\nDetails: ' + data.details : ''));
      }
    } catch (error) {
      console.error('Error saving committee:', error);
      alert('Failed to save committee');
    }
  };

  const handleEdit = (committee: Committee) => {
    setEditingCommittee(committee);
    setFormData({
      name: committee.name,
      description: committee.description || '',
      capacity: committee.capacity || 30
    });
    setShowAddModal(true);
  };

  const refreshCommitteeCounts = async () => {
    setRefreshing(true);
    
    try {
      // First, recalculate committee counts
      const recalcResponse = await fetch('/api/admin/recalculate-committee-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const recalcData = await recalcResponse.json();
      
      if (recalcData.success) {
        // Then refresh the committees list
        await fetchCommittees();
        console.log('Committee counts refreshed successfully');
      } else {
        console.error('Failed to recalculate counts:', recalcData.error);
        // Still refresh the list even if recalculation fails
        await fetchCommittees();
      }
    } catch (error) {
      console.error('Error refreshing committee counts:', error);
      // Still refresh the list even if there's an error
      await fetchCommittees();
    } finally {
      setRefreshing(false);
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
            </div>
              </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Committees</p>
                  <p className="text-3xl font-bold text-blue-600">{committees.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Delegates</p>
                  <p className="text-3xl font-bold text-green-600">
                    {committees.reduce((sum, committee) => sum + (committee.current_count || committee.current_delegates || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {committees.reduce((sum, committee) => sum + (committee.capacity || committee.max_delegates || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Committees ({committees.length})</h3>
                 <div className="flex items-center gap-3">
                   <button
                    onClick={() => refreshCommitteeCounts()}
                    disabled={refreshing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {refreshing ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </>
                    )}
                  </button>
                </div>
              </div>

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
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                              </svg>
                              <span className="text-gray-600">
                                Delegates: <span className="font-semibold text-blue-600">{committee.current_count || committee.current_delegates}</span>/{committee.capacity || committee.max_delegates}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${
                                (committee.current_count || committee.current_delegates) >= (committee.capacity || committee.max_delegates) 
                                  ? 'bg-red-500' 
                                  : (committee.current_count || committee.current_delegates) >= (committee.capacity || committee.max_delegates) * 0.8 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                              }`}></div>
                              <span className="text-xs text-gray-500">
                                {Math.round(((committee.current_count || committee.current_delegates) / (committee.capacity || committee.max_delegates)) * 100)}% full
                              </span>
                            </div>
                          </div>
                  </div>
                        <div className="flex items-center gap-2">
                    <button
                            onClick={() => handleEdit(committee)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
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

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingCommittee ? 'Edit Committee' : 'Add New Committee'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Committee Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingCommittee(null);
                      setFormData({
                        name: '',
                        description: '',
                        capacity: 30
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingCommittee ? 'Update Committee' : 'Create Committee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}