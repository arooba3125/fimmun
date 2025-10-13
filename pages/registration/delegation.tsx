import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface FormData {
  delegation_name: string;
  head_delegate_committee: string;
  head_delegate_name: string;
  head_delegate_email: string;
  head_delegate_whatsapp: string;
  head_delegate_cnic: string;
  head_delegate_institution: string;
  head_delegate_experience: string;
  referral_source_id: string;
  payment_proof: File | null;
}

interface ReferralSource {
  id: string;
  name: string;
}

const COMMITTEES = [
  'Pakistan National Assembly',
  'Special Crisis Committee',
  'United Nations Security Council',
  'United Nations Human Rights Council',
  'Disarmament and International Security Committee',
  'Commission on the Status of Women',
  'Organization of Islamic Cooperation'
];

export default function DelegationRegistration() {
  const [formData, setFormData] = useState<FormData>({
    delegation_name: '',
    head_delegate_committee: '',
    head_delegate_name: '',
    head_delegate_email: '',
    head_delegate_whatsapp: '',
    head_delegate_cnic: '',
    head_delegate_institution: '',
    head_delegate_experience: '',
    referral_source_id: '',
    payment_proof: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [delegationSerial, setDelegationSerial] = useState('');
  const [headDelegateVerificationCode, setHeadDelegateVerificationCode] = useState('');
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
    if (name === 'head_delegate_cnic') {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      // Limit to 13 digits
      const limitedDigits = digitsOnly.slice(0, 13);
      setFormData(prev => ({ ...prev, [name]: limitedDigits }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCommitteeChange = (committee: string) => {
    setFormData(prev => ({
      ...prev,
      head_delegate_committee: committee
    }));
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
    if (!formData.delegation_name || !formData.head_delegate_name || !formData.head_delegate_email || 
        !formData.head_delegate_whatsapp || !formData.head_delegate_cnic || !formData.head_delegate_institution || !formData.payment_proof || 
        !formData.referral_source_id) {
      setError('All required fields must be filled');
      setLoading(false);
      return;
    }

    // Validate CNIC format (exactly 13 digits)
    if (formData.head_delegate_cnic.length !== 13 || !/^\d{13}$/.test(formData.head_delegate_cnic)) {
      setError('CNIC must be exactly 13 digits');
      setLoading(false);
      return;
    }

    if (!formData.head_delegate_committee) {
      setError('Please select a committee for the head delegate');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('delegation_name', formData.delegation_name);
      submitData.append('head_delegate_committee', formData.head_delegate_committee);
      submitData.append('head_delegate_name', formData.head_delegate_name);
      submitData.append('head_delegate_email', formData.head_delegate_email);
      submitData.append('head_delegate_whatsapp', formData.head_delegate_whatsapp);
      submitData.append('head_delegate_cnic', formData.head_delegate_cnic);
      submitData.append('head_delegate_institution', formData.head_delegate_institution);
      submitData.append('head_delegate_experience', formData.head_delegate_experience);
      submitData.append('referral_source_id', formData.referral_source_id);
      submitData.append('payment_proof', formData.payment_proof);

      const response = await fetch('/api/registrations/delegation', {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setDelegationSerial(data.delegation_serial);
        setHeadDelegateVerificationCode(data.head_delegate_verification_code);
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
          <title>Delegation Registered - FIMMUN 2025</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">Delegation Registered!</h1>
            <p className="text-gray-600 mb-6">
              Your delegation has been registered successfully.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2">Delegation Serial Number:</p>
              <p className="text-2xl font-mono font-bold text-blue-900">{delegationSerial}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800 mb-2">Your Verification Code (as Head Delegate):</p>
              <p className="text-2xl font-mono font-bold text-green-900">{headDelegateVerificationCode}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Share the delegation serial number with your delegation members so they can register using it. Keep your verification code safe for status checking.
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/registration/delegation-member"
                className="w-full inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Register Delegation Members
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
        <title>Delegation Registration - FIMMUN 2025</title>
        <meta name="description" content="Register a delegation for FIMMUN 2025" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Delegation Registration</h1>
              <p className="text-gray-600">
                Register your delegation and head delegate for FIMMUN 2025
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
                    <strong>Note:</strong> Registration of the Head delegate will be done alongside the Registration of Delegation. 
                    The head delegate fee is PKR 3,000. Additional delegation members will pay PKR 2,500 each.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delegation Information */}
              <div>
                <label htmlFor="delegation_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Delegation Name *
                </label>
                <input
                  type="text"
                  id="delegation_name"
                  name="delegation_name"
                  value={formData.delegation_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your delegation name"
                />
              </div>

              {/* Head Delegate Committee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Head Delegate Committee * (Select the committee you will join)
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> This is the committee you (head delegate) will join. Other delegation members will be able to select from the remaining committees.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {COMMITTEES.map((committee) => (
                    <label key={committee} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="head_delegate_committee"
                        value={committee}
                        checked={formData.head_delegate_committee === committee}
                        onChange={() => handleCommitteeChange(committee)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{committee}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Head Delegate Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Head Delegate Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="head_delegate_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Head Delegate Name *
                    </label>
                    <input
                      type="text"
                      id="head_delegate_name"
                      name="head_delegate_name"
                      value={formData.head_delegate_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter head delegate name"
                    />
                  </div>

                  <div>
                    <label htmlFor="head_delegate_email" className="block text-sm font-medium text-gray-700 mb-2">
                      Head Delegate Email *
                    </label>
                    <input
                      type="email"
                      id="head_delegate_email"
                      name="head_delegate_email"
                      value={formData.head_delegate_email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter head delegate email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label htmlFor="head_delegate_whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                      Head Delegate WhatsApp *
                    </label>
                    <input
                      type="tel"
                      id="head_delegate_whatsapp"
                      name="head_delegate_whatsapp"
                      value={formData.head_delegate_whatsapp}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter head delegate WhatsApp"
                    />
                  </div>

                  <div>
                    <label htmlFor="head_delegate_cnic" className="block text-sm font-medium text-gray-700 mb-2">
                      Head Delegate CNIC *
                    </label>
                    <input
                      type="text"
                      id="head_delegate_cnic"
                      name="head_delegate_cnic"
                      value={formData.head_delegate_cnic}
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
                  <label htmlFor="head_delegate_institution" className="block text-sm font-medium text-gray-700 mb-2">
                    Head Delegate Institution *
                  </label>
                  <input
                    type="text"
                    id="head_delegate_institution"
                    name="head_delegate_institution"
                    value={formData.head_delegate_institution}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter head delegate institution"
                    />
                  </div>

                <div className="mt-6">
                  <label htmlFor="head_delegate_experience" className="block text-sm font-medium text-gray-700 mb-2">
                    Head Delegate MUN Experience
                  </label>
                  <textarea
                    id="head_delegate_experience"
                    name="head_delegate_experience"
                    value={formData.head_delegate_experience}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe head delegate's MUN experience (optional)"
                  />
                </div>
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

              {/* Payment Information */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-900">Registration Fee</h3>
                    <p className="text-sm text-indigo-700">Head Delegate Registration</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-900">PKR 3,000</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-indigo-200">
                  <p className="text-xs text-indigo-600">
                    <strong>Note:</strong> Additional delegation members will pay PKR 2,500 each when they register.
                  </p>
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
                {loading ? 'Registering Delegation...' : 'Register Delegation'}
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
