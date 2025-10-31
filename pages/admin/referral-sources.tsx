import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface ReferralSource {
  id: string;
  name: string;
  count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ReferralSourcesAdmin() {
  const [referralSources, setReferralSources] = useState<ReferralSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [editingSource, setEditingSource] = useState<ReferralSource | null>(null);
  const [editedName, setEditedName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabaseBrowser');
        const supabase = getSupabaseBrowserClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session || !session.user) {
          setError('Not authenticated. Redirecting to login...');
          setLoading(false);
          setTimeout(() => {
            window.location.href = '/admin/login';
          }, 1500);
          return;
        }
        
        setIsAuthenticated(true);
        fetchReferralSources();
      } catch (error) {
        console.error('Auth check error:', error);
        setError('Authentication failed. Redirecting to login...');
        setLoading(false);
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1500);
      }
    };
    
    checkAuth();
  }, []);

  const fetchReferralSources = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await fetch('/api/admin/referral-sources');
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Failed to fetch referral sources');
        return;
      }
      
      if (data.success) {
        setReferralSources(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch referral sources');
      }
    } catch (err) {
      console.error('Error fetching referral sources:', err);
      setError('An error occurred while fetching referral sources');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) {
      setError('Please enter a name');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/referral-sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newSourceName.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Referral source added successfully!');
        setNewSourceName('');
        setShowAddForm(false);
        fetchReferralSources();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to add referral source');
      }
    } catch (err) {
      setError('An error occurred while adding referral source');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSource = async (id: string, name: string, is_active: boolean) => {
    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/referral-sources', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, name, is_active })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Referral source updated successfully!');
        setEditingSource(null);
        fetchReferralSources();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update referral source');
      }
    } catch (err) {
      setError('An error occurred while updating referral source');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/referral-sources', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('Referral source deleted successfully!');
        fetchReferralSources();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to delete referral source');
      }
    } catch (err) {
      setError('An error occurred while deleting referral source');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (source: ReferralSource) => {
    handleUpdateSource(source.id, source.name, !source.is_active);
  };

  const startEditing = (source: ReferralSource) => {
    setEditingSource(source);
    setEditedName(source.name);
  };

  const cancelEditing = () => {
    setEditingSource(null);
    setEditedName('');
  };

  const saveEdit = () => {
    if (editingSource && editedName.trim()) {
      handleUpdateSource(editingSource.id, editedName.trim(), editingSource.is_active);
    }
  };

  return (
    <>
      <Head>
        <title>Manage Referral Sources - FIMMUN 2025</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/admin" className="text-2xl font-bold text-blue-600">
                FIMMUN 2025 Admin
              </Link>
              <div className="flex space-x-4">
                <Link href="/admin" className="text-gray-600 hover:text-gray-800 transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/referral-sources" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Referral Sources
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Sources Management</h1>
                <p className="text-gray-600">Manage how attendees discover your event</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showAddForm ? 'Cancel' : 'Add New Source'}
              </button>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800">{successMessage}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Add New Source Form */}
            {showAddForm && (
              <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Referral Source</h2>
                <form onSubmit={handleAddSource} className="flex gap-4">
                  <input
                    type="text"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="Enter source name (e.g., Twitter, LinkedIn)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Adding...' : 'Add Source'}
                  </button>
                </form>
              </div>
            )}

            {/* Referral Sources Table */}
            {!isAuthenticated ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Checking authentication...</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading referral sources...</p>
              </div>
            ) : referralSources.length === 0 && !error ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No referral sources found. Add your first source to get started!</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={fetchReferralSources}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {referralSources.map((source) => (
                      <tr key={source.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingSource?.id === source.id ? (
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900">{source.name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{source.count}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              source.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {source.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingSource?.id === source.id ? (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={saveEdit}
                                disabled={submitting}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => startEditing(source)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggleActive(source)}
                                disabled={submitting}
                                className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                              >
                                {source.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteSource(source.id, source.name)}
                                disabled={submitting}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary Statistics */}
            {referralSources.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="text-sm text-blue-600 font-medium">Total Sources</div>
                  <div className="text-3xl font-bold text-blue-900 mt-2">
                    {referralSources.length}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="text-sm text-green-600 font-medium">Active Sources</div>
                  <div className="text-3xl font-bold text-green-900 mt-2">
                    {referralSources.filter(s => s.is_active).length}
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-6">
                  <div className="text-sm text-indigo-600 font-medium">Total Referrals</div>
                  <div className="text-3xl font-bold text-indigo-900 mt-2">
                    {referralSources.reduce((sum, s) => sum + s.count, 0)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

