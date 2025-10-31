import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface RegistrationSetting {
  id: string;
  setting_key: string;
  setting_value: boolean;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminRegistrationSettings() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<RegistrationSetting[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabaseBrowser');
        const supabase = getSupabaseBrowserClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session || !session.user) {
          router.replace('/admin/login');
          return;
        }

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || 'Admin',
          role: 'admin'
        });
        fetchSettings();
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/registration-settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
      } else {
        console.error('Failed to fetch settings:', data.error);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (settingKey: string, currentValue: boolean) => {
    setUpdating(settingKey);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/registration-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setting_key: settingKey,
          setting_value: !currentValue,
          updated_by: user?.email || 'admin'
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Successfully ${!currentValue ? 'enabled' : 'disabled'} ${settingKey.replace(/_/g, ' ')}`
        });
        fetchSettings(); // Refresh settings
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: 'error',
          text: `Failed to update setting: ${data.error}`
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while updating the setting'
      });
      console.error('Error updating setting:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getSettingDisplayName = (key: string): string => {
    return key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Registration Settings - Admin Portal</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col space-y-3 py-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link href="/admin/dashboard" className="text-xl sm:text-2xl font-bold text-blue-600">
                  FIMMUN Admin
                </Link>
                <span className="text-gray-400 hidden sm:inline">|</span>
                <span className="text-sm sm:text-base text-gray-600">Registration Settings</span>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <span className="text-xs sm:text-sm text-gray-600">
                  {user?.name} ({user?.role})
                </span>
                <Link
                  href="/admin/dashboard"
                  className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-center"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Registration Settings</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Control which registration types are active or inactive
            </p>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message.text}
                </span>
              </div>
            </div>
          )}

          {/* Settings Cards */}
          <div className="space-y-4 sm:space-y-6">
            {settings.map((setting) => (
              <div key={setting.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        {getSettingDisplayName(setting.setting_key)}
                      </h3>
                      <span className={`self-start px-3 py-1 text-xs font-semibold rounded-full ${
                        setting.setting_value
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {setting.setting_value ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {setting.description && (
                      <p className="text-sm sm:text-base text-gray-600 mb-4">{setting.description}</p>
                    )}
                    <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                      <p>Last updated: {formatDate(setting.updated_at)}</p>
                      {setting.updated_by && (
                        <p className="break-words">Updated by: {setting.updated_by}</p>
                      )}
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <div className="flex justify-center sm:justify-end sm:ml-6">
                    <button
                      onClick={() => handleToggleSetting(setting.setting_key, setting.setting_value)}
                      disabled={updating === setting.setting_key}
                      className={`relative inline-flex h-10 w-20 sm:h-12 sm:w-24 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        setting.setting_value
                          ? 'bg-green-600 focus:ring-green-500'
                          : 'bg-gray-300 focus:ring-gray-500'
                      } ${updating === setting.setting_key ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-8 w-8 sm:h-10 sm:w-10 transform rounded-full bg-white transition-transform ${
                          setting.setting_value ? 'translate-x-10 sm:translate-x-12' : 'translate-x-1'
                        }`}
                      />
                      <span className={`absolute text-xs font-medium ${
                        setting.setting_value
                          ? 'left-1 sm:left-2 text-white'
                          : 'right-1 sm:right-2 text-gray-700'
                      }`}>
                        {updating === setting.setting_key ? '...' : (setting.setting_value ? 'ON' : 'OFF')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Impact Info */}
                {setting.setting_key === 'alumni_registration_active' && (
                  <div className={`mt-4 p-3 sm:p-4 rounded-lg ${
                    setting.setting_value
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <p className={`text-xs sm:text-sm ${
                      setting.setting_value ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {setting.setting_value ? (
                        <>
                          <strong>Active:</strong> Alumni can register via the registration form. The form is fully accessible.
                        </>
                      ) : (
                        <>
                          <strong>Inactive:</strong> Alumni registration page shows &quot;WILL BE OPENED SOON&quot; message. 
                          Registration form is hidden and users cannot submit registrations.
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info Card */}
          <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:space-y-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 sm:mr-3 sm:mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">About Registration Settings</h4>
                <ul className="text-xs sm:text-sm text-blue-800 space-y-1 sm:space-y-2">
                  <li>• Changes take effect immediately - no server restart required</li>
                  <li>• Users will see updated status when they reload the page</li>
                  <li>• All changes are logged with timestamp and admin email</li>
                  <li>• Inactive registrations show &quot;WILL BE OPENED SOON&quot; to users</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

