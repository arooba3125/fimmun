import { useState, useEffect } from 'react';
import Head from 'next/head';

interface CommitteeCap {
  id: string;
  committee_name: string;
  max_capacity: number;
  current_count: number;
  created_at: string;
  updated_at: string;
}

export default function CommitteeCaps() {
  const [caps, setCaps] = useState<CommitteeCap[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchCaps();
  }, []);

  const fetchCaps = async () => {
    try {
      const response = await fetch('/api/admin/committee-registration-caps');
      const data = await response.json();

      if (data.success) {
        setCaps(data.caps);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch committee caps' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch committee caps' });
    } finally {
      setLoading(false);
    }
  };

  const handleCapChange = (index: number, field: 'max_capacity', value: number) => {
    const newCaps = [...caps];
    newCaps[index] = { ...newCaps[index], [field]: value };
    setCaps(newCaps);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/committee-registration-caps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caps: caps.map(cap => ({
            committee_name: cap.committee_name,
            max_capacity: cap.max_capacity
          }))
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Committee caps updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update committee caps' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update committee caps' });
    } finally {
      setSaving(false);
    }
  };

  const handleManualAdjustment = async (committeeName: string, adjustment: number) => {
    setUpdating(committeeName);
    setMessage(null);

    console.log('Sending manual adjustment request:', { committeeName, adjustment });

    try {
      const response = await fetch('/api/admin/manual-committee-adjustment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          committeeName,
          adjustment,
          reason: 'Manual on-campus registration'
        })
      });

      const data = await response.json();
      console.log('Manual adjustment response:', data);

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Successfully ${adjustment > 0 ? 'increased' : 'decreased'} ${committeeName} count by ${Math.abs(adjustment)}. New count: ${data.newCount}` 
        });
        fetchCaps(); // Refresh the data
        
        // Clear message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      } else {
        console.error('Manual adjustment failed:', data);
        setMessage({ 
          type: 'error', 
          text: `Failed to adjust count: ${data.error || 'Unknown error'}${data.details ? ` (${data.details})` : ''}`
        });
      }
    } catch (error) {
      console.error('Error calling manual adjustment API:', error);
      setMessage({ 
        type: 'error', 
        text: `Network error: ${error instanceof Error ? error.message : 'Failed to connect to server'}`
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all committee registration counts to 0? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/committee-registration-caps', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Committee registration counts reset successfully!' });
        fetchCaps(); // Refresh the data
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reset committee counts' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset committee counts' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Committee Registration Caps - Admin Dashboard</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading committee caps...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Committee Registration Caps - Admin Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Committee Registration Caps</h1>
              <p className="mt-2 text-gray-600">
                Manage registration capacity limits and view current counts for each committee
              </p>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <strong>Manual Adjustments:</strong> Use the +1 and -1 buttons to manually adjust delegate counts for on-campus registrations or corrections.
                  </div>
                </div>
              </div>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Committee Capacities</h2>
                  
                  <div className="space-y-4">
                    {caps.map((cap, index) => (
                      <div key={cap.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg">
                        <div className="md:col-span-2">
                          <h3 className="font-medium text-gray-900">{cap.committee_name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            <span className="text-xs text-gray-400">Max capacity: {cap.max_capacity}</span>
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Capacity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={cap.max_capacity}
                            onChange={(e) => handleCapChange(index, 'max_capacity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Manual Adjust
                          </label>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleManualAdjustment(cap.committee_name, -1)}
                              disabled={updating === cap.committee_name || cap.current_count === 0}
                              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Decrease by 1"
                            >
                              -1
                            </button>
                            <div className="flex items-center justify-center min-w-[60px] px-3 py-2 bg-blue-600 text-white font-bold rounded-md">
                              {cap.current_count}
                            </div>
                            <button
                              onClick={() => handleManualAdjustment(cap.committee_name, 1)}
                              disabled={updating === cap.committee_name}
                              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Increase by 1"
                            >
                              +1
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-end">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            cap.current_count >= cap.max_capacity 
                              ? 'bg-red-100 text-red-800' 
                              : cap.current_count >= cap.max_capacity * 0.8 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {cap.current_count >= cap.max_capacity 
                              ? 'Full' 
                              : cap.current_count >= cap.max_capacity * 0.8 
                                ? 'Almost Full'
                                : 'Available'
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={handleReset}
                    disabled={saving}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Resetting...' : 'Reset All Counts'}
                  </button>
                  
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Statistics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900">Total Capacity</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {caps.reduce((sum, cap) => sum + cap.max_capacity, 0)}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-900">Total Registered</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {caps.reduce((sum, cap) => sum + cap.current_count, 0)}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-900">Available Spots</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {caps.reduce((sum, cap) => sum + (cap.max_capacity - cap.current_count), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
