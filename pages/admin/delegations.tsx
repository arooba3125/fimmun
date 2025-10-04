import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface Delegation {
  id: string;
  delegation_name: string;
  delegation_serial: string;
  committee_preferences: string[];
  head_delegate_name: string;
  head_delegate_email: string;
  head_delegate_whatsapp: string;
  head_delegate_institution: string;
  head_delegate_experience: string | null;
  payment_proof_url: string | null;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
  delegation_members?: DelegationMember[];
}

interface DelegationMember {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  institution: string;
  mun_experience: string | null;
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

export default function AdminDelegations() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [editingDelegation, setEditingDelegation] = useState<Delegation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedDelegation, setExpandedDelegation] = useState<string | null>(null);
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
    fetchDelegations();
    setLoading(false);
  }, [router]);

  const fetchDelegations = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/delegations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDelegations(data.delegations || []);
      }
    } catch (error) {
      console.error('Error fetching delegations:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'verified' | 'rejected') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/delegations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        await fetchDelegations(); // Refresh the list
        setShowEditModal(false);
        setEditingDelegation(null);
      }
    } catch (error) {
      console.error('Error updating delegation status:', error);
    }
  };

  const handleMemberStatusUpdate = async (id: string, status: 'verified' | 'rejected') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/delegation-members', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        await fetchDelegations(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating delegation member status:', error);
    }
  };

  const filteredDelegations = delegations.filter(delegation => {
    if (filter === 'all') return true;
    return delegation.status === filter;
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
        <title>Manage Delegations - FIMMUN 2025 Admin</title>
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
                  onClick={() => {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    router.push('/admin');
                  }}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage Delegations</h1>
            <p className="mt-2 text-gray-600">Review and manage delegation registrations</p>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: 'All', count: delegations.length },
                  { key: 'pending', label: 'Pending', count: delegations.filter(d => d.status === 'pending').length },
                  { key: 'verified', label: 'Verified', count: delegations.filter(d => d.status === 'verified').length },
                  { key: 'rejected', label: 'Rejected', count: delegations.filter(d => d.status === 'rejected').length },
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

          {/* Delegations List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredDelegations.map((delegation) => (
                <li key={delegation.id}>
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{delegation.delegation_name}</h3>
                            <p className="text-sm text-gray-500">Serial: {delegation.delegation_serial}</p>
                            <p className="text-sm text-gray-500">Head: {delegation.head_delegate_name}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={getStatusBadge(delegation.status)}>
                              {delegation.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Head Delegate Email: {delegation.head_delegate_email}</p>
                          <p>Head Delegate WhatsApp: {delegation.head_delegate_whatsapp}</p>
                          <p>Institution: {delegation.head_delegate_institution}</p>
                          <p>Committee Preferences: {delegation.committee_preferences.join(', ')}</p>
                          <p>Registered: {new Date(delegation.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {delegation.payment_proof_url && (
                          <a
                            href={delegation.payment_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Proof
                          </a>
                        )}
                        {delegation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(delegation.id, 'verified')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(delegation.id, 'rejected')}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setExpandedDelegation(
                            expandedDelegation === delegation.id ? null : delegation.id
                          )}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          {expandedDelegation === delegation.id ? 'Hide Members' : 'Show Members'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingDelegation(delegation);
                            setShowEditModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Delegation Members */}
                    {expandedDelegation === delegation.id && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">
                          Delegation Members ({delegation.delegation_members?.length || 0})
                        </h4>
                        {delegation.delegation_members && delegation.delegation_members.length > 0 ? (
                          <div className="space-y-2">
                            {delegation.delegation_members.map((member) => (
                              <div key={member.id} className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{member.name}</p>
                                    <p className="text-sm text-gray-500">{member.email}</p>
                                    <p className="text-sm text-gray-500">{member.institution}</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={getStatusBadge(member.status)}>
                                      {member.status.toUpperCase()}
                                    </span>
                                    {member.serial_number && (
                                      <span className="text-sm font-mono text-blue-600">
                                        {member.serial_number}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <p className="text-xs text-gray-500">
                                    Verification Code: {member.verification_code}
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    {member.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleMemberStatusUpdate(member.id, 'verified')}
                                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                        >
                                          Verify
                                        </button>
                                        <button
                                          onClick={() => handleMemberStatusUpdate(member.id, 'rejected')}
                                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                        >
                                          Reject
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No members registered yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {filteredDelegations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No delegations found for the selected filter.</p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && editingDelegation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Update Delegation Status
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Delegation: {editingDelegation.delegation_name}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleStatusUpdate(editingDelegation.id, 'verified')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(editingDelegation.id, 'rejected')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingDelegation(null);
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
