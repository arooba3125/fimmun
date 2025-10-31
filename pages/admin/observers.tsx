import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';

interface Observer {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  cnic: string | null;
  institution: string;
  mun_experience: string | null;
  payment_proof_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  serial_number: string | null;
  verification_code: string;
  created_at: string;
  updated_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminObservers() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [observers, setObservers] = useState<Observer[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [editingObserver, setEditingObserver] = useState<Observer | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');

    if (!token || !userData) {
      router.push('/admin');
      return;
    }

    setUser(JSON.parse(userData));
    fetchObservers();
    setLoading(false);
  }, [router]);

  const fetchObservers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/observers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setObservers(data.observers || []);
      }
    } catch (error) {
      console.error('Error fetching observers:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'verified' | 'rejected') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/observers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        await fetchObservers(); // Refresh the list
        setShowEditModal(false);
        setEditingObserver(null);
      }
    } catch (error) {
      console.error('Error updating observer status:', error);
    }
  };

  const filteredObservers = observers.filter(observer => {
    if (filter === 'all') return true;
    return observer.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'verified':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredObservers.map((observer) => ({
      'Serial Number': observer.serial_number || 'N/A',
      'Name': observer.name,
      'Email': observer.email,
      'WhatsApp': observer.whatsapp,
      'CNIC': observer.cnic || 'N/A',
      'Institution': observer.institution,
      'MUN Experience': observer.mun_experience || 'N/A',
      'Status': observer.status.toUpperCase(),
      'Verification Code': observer.verification_code,
      'Registered Date': new Date(observer.created_at).toLocaleDateString(),
      'Updated Date': new Date(observer.updated_at).toLocaleDateString(),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Observers');
    
    // Generate filename with current date
    const filename = `observers_${filter}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Download file
    XLSX.writeFile(workbook, filename);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Observers - FIMMUN 2025 Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/admin/dashboard" className="text-2xl font-bold text-blue-600">
                FIMMUN 2025 Admin
              </Link>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">Welcome, {user?.name}</span>
                <button
                  onClick={async () => {
                    try {
                      const supabase = getSupabaseBrowserClient();
                      await supabase.auth.signOut();
                    } catch (error) {
                      console.error('Error logging out:', error);
                    }
                    router.push('/admin/login');
                  }}
                  className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Observers</h1>
              <p className="mt-2 text-gray-600">Review and manage observer registrations</p>
            </div>
            <button
              onClick={exportToExcel}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Excel
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: 'All', count: observers.length },
                  { key: 'pending', label: 'Pending', count: observers.filter(o => o.status === 'pending').length },
                  { key: 'verified', label: 'Verified', count: observers.filter(o => o.status === 'verified').length },
                  { key: 'rejected', label: 'Rejected', count: observers.filter(o => o.status === 'rejected').length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as 'all' | 'pending' | 'verified' | 'rejected')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      filter === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Observers List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredObservers.map((observer) => (
                <li key={observer.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{observer.name}</h3>
                          <p className="text-sm text-gray-500">{observer.email}</p>
                          <p className="text-sm text-gray-500">{observer.institution}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={getStatusBadge(observer.status)}>
                            {observer.status.toUpperCase()}
                          </span>
                          {observer.serial_number && (
                            <span className="text-sm font-mono text-blue-600">
                              {observer.serial_number}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>WhatsApp: {observer.whatsapp}</p>
                        {observer.cnic && <p>CNIC: {observer.cnic}</p>}
                        <p>Verification Code: {observer.verification_code}</p>
                        <p>Registered: {new Date(observer.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {observer.payment_proof_url && (
                        <a
                          href={observer.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Proof
                        </a>
                      )}
                      {observer.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(observer.id, 'verified')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(observer.id, 'rejected')}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setEditingObserver(observer);
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {filteredObservers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No observers found for the selected filter.</p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && editingObserver && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Update Observer Status
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Observer: {editingObserver.name}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleStatusUpdate(editingObserver.id, 'verified')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(editingObserver.id, 'rejected')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingObserver(null);
                    }}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
