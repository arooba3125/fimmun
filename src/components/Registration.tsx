'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CommitteeCap {
  id: string;
  committee_name: string;
  max_capacity: number;
  current_count: number;
  created_at: string;
  updated_at: string;
}

export default function Registration() {
  const [committeeCaps, setCommitteeCaps] = useState<CommitteeCap[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAlumniActive, setIsAlumniActive] = useState<boolean>(true);

  useEffect(() => {
    const fetchCommitteeCaps = async () => {
      try {
        const response = await fetch('/api/admin/committee-registration-caps', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        type CapsResponse = { success: boolean; caps: CommitteeCap[] };
        let data: CapsResponse | null = null;
        try {
          data = (await response.json()) as CapsResponse;
        } catch {
          throw new Error('Invalid JSON');
        }
        if (data && data.success && Array.isArray(data.caps)) {
          setCommitteeCaps(data.caps);
        } else {
          throw new Error('Unexpected response shape');
        }
      } catch (error) {
        console.warn('Falling back to default committee caps. Reason:', error);
        setCommitteeCaps([
          { id: '1', committee_name: 'Pakistan National Assembly', max_capacity: 30, current_count: 0, created_at: '', updated_at: '' },
          { id: '2', committee_name: 'Special Crisis Committee', max_capacity: 30, current_count: 0, created_at: '', updated_at: '' },
          { id: '3', committee_name: 'United Nations Security Council', max_capacity: 30, current_count: 0, created_at: '', updated_at: '' },
          { id: '4', committee_name: 'United Nations Human Rights Council', max_capacity: 30, current_count: 0, created_at: '', updated_at: '' },
          { id: '5', committee_name: 'Disarmament and International Security Committee', max_capacity: 30, current_count: 0, created_at: '', updated_at: '' },
          { id: '6', committee_name: 'Commission on the Status of Women', max_capacity: 30, current_count: 0, created_at: '', updated_at: '' },
          { id: '7', committee_name: 'Organization of Islamic Cooperation', max_capacity: 30, current_count: 0, created_at: '', updated_at: '' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    const checkAlumniStatus = async () => {
      try {
        const response = await fetch('/api/registration-status/alumni');
        const data = await response.json();
        if (data.success) {
          setIsAlumniActive(data.isActive);
        }
      } catch (error) {
        console.error('Error checking alumni registration status:', error);
      }
    };

    fetchCommitteeCaps();
    checkAlumniStatus();
  }, []);

  const getTotalDelegatesCap = () => {
    return committeeCaps.reduce((total, cap) => total + cap.max_capacity, 0);
  };

  const getTotalObserversCap = () => {
    // Observers don't have committee assignments, so we'll use a fixed number
    return 150;
  };

  const getTotalAlumniCap = () => {
    // Alumni don't have committee assignments, so we'll use a fixed number
    return 100;
  };

  const getCommitteeCap = (committeeName: string) => {
    const cap = committeeCaps.find(c => c.committee_name === committeeName);
    return cap ? cap.max_capacity : 0;
  };
  return (
    <section id="registration" className="py-20 bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Registration <span className="text-blue-200">Categories</span>
          </h2>
          <div className="w-24 h-1 bg-blue-200 mx-auto mb-8"></div>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Choose your registration category and secure your spot at FIMMUN 2025
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Private Delegate */}
          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Private Delegate</h3>
              <p className="text-gray-600">Register as an individual delegate</p>
            </div>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Committee preferences available</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Full MUN experience</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Serial number (OD-XXX)</span>
              </div>
            </div>
            
            <Link
              href="/registration/private-delegate"
              className="w-full inline-block text-center py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-lg"
            >
              Register as Private Delegate
            </Link>
          </div>

          {/* Observer */}
          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Observer</h3>
              <p className="text-gray-600">Attend sessions as an observer</p>
            </div>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Watch all committee sessions</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Learn from experienced delegates</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Observer serial number (OO-XXX)</span>
              </div>
            </div>
            
            <Link
              href="/registration/observer"
              className="w-full inline-block text-center py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-lg"
            >
              Register as Observer
            </Link>
          </div>

          {/* Alumni */}
          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 relative">
            {!isAlumniActive && (
              <div className="absolute top-4 right-4">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Opening Soon
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Alumni</h3>
              <p className="text-gray-600">Ex-Minhasians exclusive events</p>
            </div>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Exclusive reunion party</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Formal dinner event</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Alumni serial number (OA-XXX)</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">2nd day attendance only</span>
              </div>
            </div>
            
            <Link
              href="/registration/alumni"
              className={`w-full inline-block text-center py-4 font-semibold rounded-lg transition-colors duration-300 shadow-lg ${
                isAlumniActive
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              }`}
            >
              {isAlumniActive ? 'Register as Alumni' : 'View Details (Opening Soon)'}
            </Link>
          </div>

          {/* Delegation */}
          <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Delegation</h3>
              <p className="text-gray-600">Register as a group with head delegate</p>
            </div>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Group registration benefits</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Committee preferences available</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Delegation serial (DEL-XXX)</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Member serial numbers (OD-XXX)</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link
                href="/registration/delegation"
                className="w-full inline-block text-center py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-lg"
              >
                Register Delegation
              </Link>
              <Link
                href="/registration/delegation-member"
                className="w-full inline-block text-center py-4 border border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors duration-300"
              >
                Join Existing Delegation
              </Link>
            </div>
          </div>
        </div>
        
        {/* Registration Caps Info */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Registration Caps</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-200 mb-2">
                {loading ? '...' : getTotalDelegatesCap()}
              </div>
              <div className="text-blue-100">Total Delegates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-200 mb-2">
                {loading ? '...' : getTotalObserversCap()}
              </div>
              <div className="text-blue-100">Observers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-200 mb-2">
                {loading ? '...' : getTotalAlumniCap()}
              </div>
              <div className="text-blue-100">Alumni</div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <h4 className="text-lg font-semibold text-white mb-4">Committee Caps</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-semibold text-white">PNA</div>
                <div className="text-blue-200">{loading ? '...' : getCommitteeCap('Pakistan National Assembly')} delegates</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-semibold text-white">Crisis</div>
                <div className="text-blue-200">{loading ? '...' : getCommitteeCap('Special Crisis Committee')} delegates</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-semibold text-white">UNSC</div>
                <div className="text-blue-200">{loading ? '...' : getCommitteeCap('United Nations Security Council')} delegates</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-semibold text-white">UNHRC</div>
                <div className="text-blue-200">{loading ? '...' : getCommitteeCap('United Nations Human Rights Council')} delegates</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-semibold text-white">UNDISEC</div>
                <div className="text-blue-200">{loading ? '...' : getCommitteeCap('Disarmament and International Security Committee')} delegates</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-semibold text-white">UNSCW</div>
                <div className="text-blue-200">{loading ? '...' : getCommitteeCap('Commission on the Status of Women')} delegates</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-semibold text-white">OIC</div>
                <div className="text-blue-200">{loading ? '...' : getCommitteeCap('Organization of Islamic Cooperation')} delegates</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="font-semibold text-white">Additional</div>
                <div className="text-blue-200">{loading ? '...' : 0} delegates</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Checker */}
        <div className="mt-16 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Check Your Registration Status</h3>
            <p className="text-blue-100 mb-6">
              Already registered? Enter your verification code to check your status and download your MUN ticket.
            </p>
            <Link
              href="/status-checker"
              className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-300 shadow-lg"
            >
              Check Status
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
