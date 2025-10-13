import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface FormData {
  delegation_serial: string;
  name: string;
  email: string;
  whatsapp: string;
  cnic: string;
  institution: string;
  mun_experience: string;
  committee_preference: string;
  referral_source_id: string;
  payment_proof: File | null;
}

interface ReferralSource {
  id: string;
  name: string;
}

// Removed unused COMMITTEES constant

export default function DelegationMemberRegistration() {
  const [formData, setFormData] = useState<FormData>({
    delegation_serial: '',
    name: '',
    email: '',
    whatsapp: '',
    cnic: '',
    institution: '',
    mun_experience: '',
    committee_preference: '',
    referral_source_id: '',
    payment_proof: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [availableCommittees, setAvailableCommittees] = useState<string[]>([]);
  const [checkingCommittees, setCheckingCommittees] = useState(false);
  const [delegationInfo, setDelegationInfo] = useState<{
    delegation_name: string;
    head_delegate_committee: string;
    committee_preferences: string[];
  } | null>(null);
  const [referralSources, setReferralSources] = useState<ReferralSource[]>([]);

  useEffect(() => {
    // Fetch referral sources on component mount
    const fetchReferralSources = async () => {
      try {
        const response = await fetch('/api/referral-sources');
        const data = await response.json();
        if (data.success) {
          setReferralSources(data.data);
        }
      } catch (error) {
        console.error('Error fetching referral sources:', error);
      }
    };
    fetchReferralSources();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for CNIC field - only allow 13 digits
    if (name === 'cnic') {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      // Limit to 13 digits
      const limitedDigits = digitsOnly.slice(0, 13);
      setFormData(prev => ({ ...prev, [name]: limitedDigits }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Check available committees when delegation serial changes
    if (name === 'delegation_serial' && value) {
      checkAvailableCommittees(value);
    }
  };

  const handleCommitteeChange = (committee: string) => {
    setFormData(prev => ({
      ...prev,
      committee_preference: committee
    }));
  };

  const checkAvailableCommittees = async (delegationSerial: string) => {
    setCheckingCommittees(true);
    try {
      const response = await fetch(`/api/delegations/${delegationSerial}/available-committees`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAvailableCommittees(data.available_committees);
        setDelegationInfo(data.delegation_info);
      } else {
        setAvailableCommittees([]);
        setDelegationInfo(null);
        setError(data.message || 'Failed to fetch available committees');
      }
    } catch (error) {
      console.error('Error checking available committees:', error);
      setAvailableCommittees([]);
      setError('Failed to check available committees');
    } finally {
      setCheckingCommittees(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    // Check file size (max 2MB)
    if (file && file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      e.target.value = ''; // Clear the input
      return;
    }
    
    setFormData(prev => ({ ...prev, payment_proof: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.delegation_serial || !formData.name || !formData.email || 
        !formData.whatsapp || !formData.cnic || !formData.institution || !formData.payment_proof) {
      setError('All required fields must be filled');
      setLoading(false);
      return;
    }

    if (!formData.committee_preference) {
      setError('Please select a committee preference');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('delegation_serial', formData.delegation_serial);
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('whatsapp', formData.whatsapp);
      submitData.append('cnic', formData.cnic);
      submitData.append('institution', formData.institution);
      submitData.append('mun_experience', formData.mun_experience);
      submitData.append('committee_preference', formData.committee_preference);
      submitData.append('referral_source_id', formData.referral_source_id);
      submitData.append('payment_proof', formData.payment_proof);

      const response = await fetch('/api/registrations/delegation-member', {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setVerificationCode(data.verification_code);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Registration Successful - FIMMUN 2025</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your delegation member registration has been submitted successfully.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2">Your Verification Code:</p>
              <p className="text-2xl font-mono font-bold text-blue-900">{verificationCode}</p>
            </div>

            <div className="space-y-4">
              <Link
                href="/status-checker"
                className="w-full inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Check Registration Status
              </Link>
              <Link
                href="/"
                className="w-full inline-block px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Delegation Member Registration - FIMMUN 2025</title>
        <meta name="description" content="Register as a delegation member for FIMMUN 2025" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                FIMMUN 2025
              </Link>
              <div className="flex space-x-4">
                <Link href="/registration" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Registration Options
                </Link>
                <Link href="/status-checker" className="text-gray-600 hover:text-gray-800 transition-colors">
                  Status Checker
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Delegation Member Registration</h1>
              <p className="text-gray-600">
                Register as a member of an existing delegation
              </p>
            </div>

            {/* Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You need the delegation serial number from your head delegate to register. 
                    This serial number is provided after the delegation is registered.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delegation Serial */}
              <div>
                <label htmlFor="delegation_serial" className="block text-sm font-medium text-gray-700 mb-2">
                  Delegation Serial Number *
                </label>
                <input
                  type="text"
                  id="delegation_serial"
                  name="delegation_serial"
                  value={formData.delegation_serial}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="e.g., DEL-001"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the delegation serial number provided by your head delegate
                </p>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your WhatsApp number"
                  />
                </div>

                <div>
                  <label htmlFor="cnic" className="block text-sm font-medium text-gray-700 mb-2">
                    CNIC *
                  </label>
                  <input
                    type="text"
                    id="cnic"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    required
                    inputMode="numeric"
                    pattern="[0-9]{13}"
                    maxLength={13}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter 13 digits only"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter 13 digits without dashes</p>
                </div>
              </div>

              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Institution *
                </label>
                <input
                  type="text"
                  id="institution"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your school/college name"
                  />
                </div>

              {/* MUN Experience */}
              <div>
                <label htmlFor="mun_experience" className="block text-sm font-medium text-gray-700 mb-2">
                  MUN Experience
                </label>
                <textarea
                  id="mun_experience"
                  name="mun_experience"
                  value={formData.mun_experience}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your previous MUN experience (optional)"
                />
              </div>

              {/* Referral Source */}
              <div>
                <label htmlFor="referral_source_id" className="block text-sm font-medium text-gray-700 mb-2">
                  How did you hear about us? *
                </label>
                <select
                  id="referral_source_id"
                  name="referral_source_id"
                  value={formData.referral_source_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an option</option>
                  {referralSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Committee Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Committee Preference * (Select one)
                </label>
                
                {delegationInfo && delegationInfo.head_delegate_committee && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm text-blue-800">
                          <strong>Head Delegate Committee:</strong> The head delegate is assigned to <strong>&quot;{delegationInfo.head_delegate_committee}&quot;</strong> committee.
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          You can select from the remaining committees. Each committee can only be assigned to one member.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!formData.delegation_serial ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">
                      Please enter a delegation serial number first to see available committees
                    </p>
                  </div>
                ) : checkingCommittees ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-blue-600">Checking available committees...</p>
                  </div>
                ) : availableCommittees.length === 0 ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-600">
                      No committees available for this delegation. All committees may be assigned or delegation is full.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableCommittees.map((committee) => (
                      <label key={committee} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="committee_preference"
                          value={committee}
                          checked={formData.committee_preference === committee}
                          onChange={() => handleCommitteeChange(committee)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{committee}</span>
                      </label>
                    ))}
                  </div>
                )}
                {availableCommittees.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {delegationInfo?.head_delegate_committee 
                      ? "Available committees exclude the head delegate's committee. Each committee can only be assigned to one member per delegation."
                      : "Only available committees are shown. Each committee can only be assigned to one member per delegation."
                    }
                  </p>
                )}
              </div>

              {/* Payment Information */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-900">Registration Fee</h3>
                    <p className="text-sm text-indigo-700">Delegation Member Registration</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-900">PKR 2,500</p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bank Details for Payment</h3>
                <div className="bg-gray-800 rounded-lg p-4 text-white">
                  <div className="mb-2">
                    <p className="text-lg font-bold">FARZANA PERVEEN</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-300">01201003345332</p>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText('01201003345332')}
                        className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">Bank Alfalah</p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Please make the payment to the above account and upload proof of payment.
                </p>
              </div>

              {/* Payment Proof */}
              <div>
                <label htmlFor="payment_proof" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Proof *
                </label>
                <input
                  type="file"
                  id="payment_proof"
                  name="payment_proof"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Upload a screenshot or image of your payment proof (JPG, PNG, or PDF). Maximum file size: 2MB
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-800">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting Registration...' : 'Submit Registration'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Need help? Contact us at{' '}
                <a href="mailto:fimmunv@gmail.com" className="text-blue-600 hover:text-blue-800">
                  fimmunv@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
