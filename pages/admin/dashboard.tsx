import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';

interface DashboardStats {
  verified: {
    delegates: number;
    observers: number;
    alumni: number;
    delegations: number;
    delegation_members: number;
    total: number;
  };
  pending: {
    delegates: number;
    observers: number;
    alumni: number;
    delegations: number;
    delegation_members: number;
    total: number;
  };
  caps: {
    delegates: {
      current: number;
      max: number;
      available: number;
    };
    observers: {
      current: number;
      max: number;
      available: number;
    };
    alumni: {
      current: number;
      max: number;
      available: number;
    };
  };
  recent_registrations: Array<{
    created_at: string;
    name: string;
    email: string;
    type: string;
  }>;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface CommitteeCap {
  id: string;
  committee_name: string;
  max_capacity: number;
  current_count: number;
  created_at: string;
  updated_at: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [committeeCaps, setCommitteeCaps] = useState<CommitteeCap[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Check authentication with Supabase
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session || !session.user) {
          // Not authenticated, redirect to login
          router.replace('/admin/login');
          return;
        }

        // Set user data from Supabase session
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || 'Admin',
          role: 'admin'
        });

        fetchStats();
        fetchCommitteeCaps();
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/admin/login');
      }
    };

    checkAuth();

    return () => clearInterval(timer);
  }, [router]);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const fetchCommitteeCaps = async () => {
    try {
      const response = await fetch('/api/admin/committee-registration-caps');
      const data = await response.json();
      
      if (data.success) {
        setCommitteeCaps(data.caps);
      }
    } catch (error) {
      console.error('Error fetching committee caps:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - FIMMUN 2025</title>
        <meta name="description" content="FIMMUN Admin Dashboard" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-sm text-gray-500">FIMMUN 2025 Management</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
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
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h2>
                  <p className="text-gray-600 mt-2">
                    {formatDate(currentTime)} • {formatTime(currentTime)}
                  </p>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => {
                      fetchStats(true);
                      fetchCommitteeCaps();
                    }}
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
                        Refresh Data
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Verified</p>
                    <p className="text-3xl font-bold text-green-600">{stats.verified.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Private Delegates</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.verified.delegates}</p>
                    <p className="text-xs text-gray-500">{stats.caps.delegates.current}/{stats.caps.delegates.max}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Observers</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.verified.observers}</p>
                    <p className="text-xs text-gray-500">{stats.caps.observers.current}/{stats.caps.observers.max}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Committee Registration Caps */}
          {committeeCaps.length > 0 && (
            <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Committee Registration Status</h2>
                <Link 
                  href="/admin/committee-caps"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Manage Caps
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {committeeCaps.map((cap) => (
                  <div key={cap.id} className="bg-white/40 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 truncate" title={cap.committee_name}>
                      {cap.committee_name}
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">
                        {cap.current_count} / {cap.max_capacity}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          cap.current_count >= cap.max_capacity 
                            ? 'bg-red-500' 
                            : cap.current_count >= cap.max_capacity * 0.8 
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((cap.current_count / cap.max_capacity) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Management Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/admin/private-delegates" className="group">
              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Private Delegates</h3>
                    <p className="text-sm text-gray-600">Manage individual delegates</p>
                    {stats && (
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.verified.delegates} verified • {stats.pending.delegates} pending
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/observers" className="group">
              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Observers</h3>
                    <p className="text-sm text-gray-600">Manage observers</p>
                    {stats && (
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.verified.observers} verified • {stats.pending.observers} pending
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/alumni" className="group">
              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Alumni</h3>
                    <p className="text-sm text-gray-600">Manage alumni registrations</p>
                    {stats && (
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.verified.alumni} verified • {stats.pending.alumni} pending
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/delegation-members" className="group">
              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delegation Members</h3>
                    <p className="text-sm text-gray-600">Manage delegation members</p>
                    {stats && (
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.verified.delegation_members} verified • {stats.pending.delegation_members} pending
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/delegations" className="group">
              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delegations</h3>
                    <p className="text-sm text-gray-600">Manage delegations</p>
                    {stats && (
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.verified.delegations} verified • {stats.pending.delegations} pending
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>


            <Link href="/admin/timeline" className="group">
              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
                    <p className="text-sm text-gray-600">Manage conference schedule and events</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Create and edit timeline events
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>


          {/* Additional Management Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link href="/admin/registration-settings" className="group">
              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Registration Settings</h3>
                    <p className="text-sm text-gray-600">Control registration availability</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Enable/disable registration types
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/referral-sources" className="group">
              <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Referral Sources</h3>
                    <p className="text-sm text-gray-600">Manage how attendees found us</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Track marketing and referral channels
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                    <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Registrations */}
          {stats && stats.recent_registrations.length > 0 && (
            <div className="bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h3>
              <div className="space-y-3">
                {stats.recent_registrations.slice(0, 5).map((registration, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{registration.name}</p>
                      <p className="text-sm text-gray-600">{registration.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">{registration.type}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(registration.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}