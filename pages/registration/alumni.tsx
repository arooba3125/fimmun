import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface FormData {
  name: string;
  email: string;
  whatsapp: string;
  cnic: string;
  batch: string;
  referral_source_id: string;
  payment_proof: File | null;
}

interface ReferralSource {
  id: string;
  name: string;
}

export default function AlumniRegistration() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    whatsapp: '',
    cnic: '',
    batch: '',
    referral_source_id: '',
    payment_proof: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [referralSources, setReferralSources] = useState<ReferralSource[]>([]);
  const [isRegistrationActive, setIsRegistrationActive] = useState<boolean | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    // Check if alumni registration is active
    const checkRegistrationStatus = async () => {
      try {
        const response = await fetch('/api/registration-status/alumni');
        const data = await response.json();
        if (data.success) {
          setIsRegistrationActive(data.isActive);
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
        setIsRegistrationActive(false); // Default to closed on error
      } finally {
        setStatusLoading(false);
      }
    };

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

    checkRegistrationStatus();
    fetchReferralSources();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (!formData.name || !formData.email || !formData.whatsapp || !formData.cnic || !formData.batch || !formData.payment_proof || !formData.referral_source_id) {
      setError('All required fields must be filled');
      setLoading(false);
      return;
    }

    // Validate CNIC format (exactly 13 digits)
    if (formData.cnic.length !== 13 || !/^\d{13}$/.test(formData.cnic)) {
      setError('CNIC must be exactly 13 digits');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('whatsapp', formData.whatsapp);
      submitData.append('cnic', formData.cnic);
      submitData.append('batch', formData.batch);
      submitData.append('referral_source_id', formData.referral_source_id);
      submitData.append('payment_proof', formData.payment_proof);

      const response = await fetch('/api/registrations/alumni', {
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
              Your alumni registration has been submitted successfully.
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

  // Show loading state while checking registration status
  if (statusLoading) {
    return (
      <>
        <Head>
          <title>Alumni Registration - FIMMUN 2025</title>
          <meta name="description" content="Register as alumni for FIMMUN 2025" />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-green-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Checking registration status...</p>
          </div>
        </div>
      </>
    );
  }

  // Show "WILL BE OPENED SOON" message if registration is not active
  if (!isRegistrationActive) {
    return (
      <>
        <Head>
          <title>Alumni Registration - FIMMUN 2025</title>
          <meta name="description" content="Register as alumni for FIMMUN 2025" />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-green-50 to-indigo-100">
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
              <div className="text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Alumni Registration</h1>
                
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8">
                  <h2 className="text-2xl font-bold text-yellow-800 mb-3">WILL BE OPENED SOON</h2>
                  <p className="text-yellow-700 text-lg">
                    Alumni registration is currently not active. Please check back later for updates.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">What to Expect</h3>
                  <ul className="text-sm text-blue-800 space-y-2 text-left">
                    <li>• Alumni will arrive on 2nd day only (22 November)</li>
                    <li>• You can observe committee sessions on the 2nd day</li>
                    <li>• Enjoy the social evening and exclusive reunion party</li>
                    <li>• Attend the formal dinner hosted for alumni</li>
                    <li>• Only Ex-Minhasians are eligible for this category</li>
                    <li>• Registration fee: PKR 2,000</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <Link
                    href="/registration"
                    className="w-full inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Other Registration Options
                  </Link>
                  <Link
                    href="/"
                    className="w-full inline-block px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to Home
                  </Link>
                </div>

                <div className="mt-8">
                  <p className="text-sm text-gray-600">
                    For updates, follow us on social media or contact us at{' '}
                    <a href="mailto:fimmunv@gmail.com" className="text-blue-600 hover:text-blue-800">
                      fimmunv@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Alumni Registration - FIMMUN 2025</title>
        <meta name="description" content="Register as alumni for FIMMUN 2025" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-indigo-100">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Alumni Registration</h1>
              <p className="text-gray-600">
                Register as alumni to attend the exclusive reunion and social events
              </p>
            </div>

            {/* Important Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Note for Alumni</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Alumni will arrive on 2nd day only (22 November)</li>
                    <li>• You can observe committee sessions on the 2nd day</li>
                    <li>• Enjoy the social evening and exclusive reunion party</li>
                    <li>• Attend the formal dinner hosted for alumni</li>
                    <li>• Only Ex-Minhasians are eligible for this category</li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-2">
                  Batch *
                </label>
                <input
                  type="text"
                  id="batch"
                  name="batch"
                  value={formData.batch}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2020-2024"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your graduation batch years
                </p>
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Registration Fee</h3>
                    <p className="text-sm text-green-700">Alumni Registration</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-900">PKR 2,000</p>
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
                className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
