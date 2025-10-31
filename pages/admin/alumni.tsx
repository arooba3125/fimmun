import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';

interface Alumni {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  cnic: string | null;
  batch: string;
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

export default function AdminAlumni() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [editingAlumni, setEditingAlumni] = useState<Alumni | null>(null);
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
    fetchAlumni();
    setLoading(false);
  }, [router]);

  const fetchAlumni = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/alumni', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlumni(data.alumni || []);
      }
    } catch (error) {
      console.error('Error fetching alumni:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'verified' | 'rejected') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/alumni', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        await fetchAlumni(); // Refresh the list
        setShowEditModal(false);
        setEditingAlumni(null);
      }
    } catch (error) {
      console.error('Error updating alumni status:', error);
    }
  };

  const filteredAlumni = alumni.filter(alumniMember => {
    if (filter === 'all') return true;
    return alumniMember.status === filter;
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
    const exportData = filteredAlumni.map((alumniMember) => ({
      'Serial Number': alumniMember.serial_number || 'N/A',
      'Name': alumniMember.name,
      'Email': alumniMember.email,
      'WhatsApp': alumniMember.whatsapp,
      'CNIC': alumniMember.cnic || 'N/A',
      'Batch': alumniMember.batch,
      'Status': alumniMember.status.toUpperCase(),
      'Verification Code': alumniMember.verification_code,
      'Registered Date': new Date(alumniMember.created_at).toLocaleDateString(),
      'Updated Date': new Date(alumniMember.updated_at).toLocaleDateString(),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alumni');
    
    // Generate filename with current date
    const filename = `alumni_${filter}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
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
        <title>Manage Alumni - FIMMUN 2025 Admin</title>
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
              <h1 className="text-3xl font-bold text-gray-900">Manage Alumni</h1>
              <p className="mt-2 text-gray-600">Review and manage alumni registrations</p>
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
                  { key: 'all', label: 'All', count: alumni.length },
                  { key: 'pending', label: 'Pending', count: alumni.filter(a => a.status === 'pending').length },
                  { key: 'verified', label: 'Verified', count: alumni.filter(a => a.status === 'verified').length },
                  { key: 'rejected', label: 'Rejected', count: alumni.filter(a => a.status === 'rejected').length },
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

          {/* Alumni List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredAlumni.map((alumniMember) => (
                <li key={alumniMember.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{alumniMember.name}</h3>
                          <p className="text-sm text-gray-500">{alumniMember.email}</p>
                          <p className="text-sm text-gray-500">Batch: {alumniMember.batch}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={getStatusBadge(alumniMember.status)}>
                            {alumniMember.status.toUpperCase()}
                          </span>
                          {alumniMember.serial_number && (
                            <span className="text-sm font-mono text-blue-600">
                              {alumniMember.serial_number}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>WhatsApp: {alumniMember.whatsapp}</p>
                        {alumniMember.cnic && <p>CNIC: {alumniMember.cnic}</p>}
                        <p>Verification Code: {alumniMember.verification_code}</p>
                        <p>Registered: {new Date(alumniMember.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {alumniMember.payment_proof_url && (
                        <a
                          href={alumniMember.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Proof
                        </a>
                      )}
                      {alumniMember.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(alumniMember.id, 'verified')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(alumniMember.id, 'rejected')}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setEditingAlumni(alumniMember);
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

          {filteredAlumni.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No alumni found for the selected filter.</p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && editingAlumni && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Update Alumni Status
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Alumni: {editingAlumni.name} ({editingAlumni.batch})
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleStatusUpdate(editingAlumni.id, 'verified')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(editingAlumni.id, 'rejected')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingAlumni(null);
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
