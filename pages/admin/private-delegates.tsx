import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface PrivateDelegate {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  cnic: string | null;
  institution: string;
  mun_experience: string | null;
  committee_preferences: string[];
  payment_proof_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  serial_number: string | null;
  verification_code: string;
  created_at: string;
  updated_at: string;
}

export default function AdminPrivateDelegates() {
  const [delegates, setDelegates] = useState<PrivateDelegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchDelegates();
  }, [router]);

  const fetchDelegates = async () => {
    try {
      const response = await fetch('/api/admin/private-delegates');
      const data = await response.json();
      
      if (data.success) {
        setDelegates(data.delegates);
      } else {
        console.error('Failed to fetch delegates:', data.error);
      }
    } catch (error) {
      console.error('Error fetching delegates:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'verified' | 'rejected') => {
    try {
      const response = await fetch('/api/admin/private-delegates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchDelegates(); // Refresh the list
      } else {
        alert('Failed to update status: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const deleteDelegate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delegate?')) return;
    
    try {
      const response = await fetch('/api/admin/private-delegates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchDelegates(); // Refresh the list
      } else {
        alert('Failed to delete delegate: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting delegate:', error);
      alert('Failed to delete delegate');
    }
  };

  const filteredDelegates = delegates.filter(delegate => 
    filter === 'all' || delegate.status === filter
  );

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredDelegates.map((delegate) => ({
      'Serial Number': delegate.serial_number || 'N/A',
      'Name': delegate.name,
      'Email': delegate.email,
      'WhatsApp': delegate.whatsapp,
      'CNIC': delegate.cnic || 'N/A',
      'Institution': delegate.institution,
      'MUN Experience': delegate.mun_experience || 'N/A',
      'Committee Preferences': delegate.committee_preferences.join(', ') || 'N/A',
      'Status': delegate.status.toUpperCase(),
      'Verification Code': delegate.verification_code,
      'Registered Date': new Date(delegate.created_at).toLocaleDateString(),
      'Updated Date': new Date(delegate.updated_at).toLocaleDateString(),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Private Delegates');
    
    // Generate filename with current date
    const filename = `private_delegates_${filter}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Download file
    XLSX.writeFile(workbook, filename);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delegates...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Private Delegates Management - FIMMUN Admin</title>
        <meta name="description" content="Manage private delegates" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col space-y-4 py-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
              <div className="flex items-center space-x-4">
                <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Private Delegates</h1>
                  <p className="text-xs sm:text-sm text-gray-500">Manage individual delegate registrations</p>
                </div>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'verified' | 'rejected')}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">All ({delegates.length})</option>
                  <option value="pending">Pending ({delegates.filter(d => d.status === 'pending').length})</option>
                  <option value="verified">Verified ({delegates.filter(d => d.status === 'verified').length})</option>
                  <option value="rejected">Rejected ({delegates.filter(d => d.status === 'rejected').length})</option>
                </select>
                <div className="flex space-x-2">
                  <button
                    onClick={fetchDelegates}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Download</span> Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg">
            <div className="p-6">
              {filteredDelegates.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No delegates found</h3>
                  <p className="mt-1 text-sm text-gray-500">No delegates match the current filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDelegates.map((delegate) => (
                    <div key={delegate.id} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
                      <div className="space-y-4">
                        {/* Header with name and status */}
                        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                            <h4 className="text-lg font-semibold text-gray-900">{delegate.name}</h4>
                            <div className="flex flex-wrap gap-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                delegate.status === 'verified' 
                                  ? 'bg-green-100 text-green-800' 
                                  : delegate.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {delegate.status.toUpperCase()}
                              </span>
                              {delegate.serial_number && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  {delegate.serial_number}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2">
                            {delegate.payment_proof_url && (
                              <a
                                href={delegate.payment_proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                              >
                                View Proof
                              </a>
                            )}
                            {delegate.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateStatus(delegate.id, 'verified')}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => updateStatus(delegate.id, 'rejected')}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => deleteDelegate(delegate.id)}
                              className="px-3 py-1 text-red-600 hover:text-red-800 text-sm border border-red-200 rounded hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        {/* Contact and basic info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-gray-600"><strong>Email:</strong> <span className="break-all">{delegate.email}</span></p>
                            <p className="text-gray-600"><strong>WhatsApp:</strong> {delegate.whatsapp}</p>
                            {delegate.cnic && (
                              <p className="text-gray-600"><strong>CNIC:</strong> {delegate.cnic}</p>
                            )}
                            <p className="text-gray-600"><strong>Institution:</strong> <span className="break-words">{delegate.institution}</span></p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-600"><strong>Verification Code:</strong> {delegate.verification_code}</p>
                            <p className="text-gray-600"><strong>Registered:</strong> {new Date(delegate.created_at).toLocaleDateString()}</p>
                            {delegate.mun_experience && (
                              <p className="text-gray-600"><strong>MUN Experience:</strong> <span className="break-words">{delegate.mun_experience}</span></p>
                            )}
                          </div>
                        </div>

                        {/* Committee preferences */}
                        {delegate.committee_preferences.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Committee Preferences:</p>
                            <div className="flex flex-wrap gap-2">
                              {delegate.committee_preferences.map((preference, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full break-words">
                                  {preference}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Payment proof link */}
                        {delegate.payment_proof_url && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Payment Proof:</p>
                            <a
                              href={delegate.payment_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm break-all"
                            >
                              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Payment Proof
                            </a>
                          </div>
                        )}
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
