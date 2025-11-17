import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface StatusResponse {
  success: boolean;
  registration_type?: string;
  name?: string;
  email?: string;
  status?: string;
  serial_number?: string;
  mun_ticket?: {
    name: string;
    serial_number: string;
    registration_type: string;
    event_name: string;
    date: string;
    location: string;
  };
  delegation_name?: string;
  delegation_serial?: string;
  created_at?: string;
  message?: string;
}

export default function StatusChecker() {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/status/${verificationCode}`);
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = async () => {
    if (!result?.mun_ticket) return;

    const ticket = result.mun_ticket;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Background
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FIMMUN 2025', canvas.width / 2, 80);

    // Subtitle
    ctx.font = '20px Arial';
    ctx.fillText('Fazaia Inter College Minhas Model United Nations', canvas.width / 2, 120);

    // Ticket details
    ctx.font = 'bold 24px Arial';
    ctx.fillText('MUN TICKET', canvas.width / 2, 180);

    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Name: ${ticket.name}`, 100, 240);
    ctx.fillText(`Serial Number: ${ticket.serial_number}`, 100, 280);
    ctx.fillText(`Registration Type: ${ticket.registration_type.replace('_', ' ').toUpperCase()}`, 100, 320);
    ctx.fillText(`Event: ${ticket.event_name}`, 100, 360);
    ctx.fillText(`Date: ${ticket.date}`, 100, 400);
    ctx.fillText(`Location: ${ticket.location}`, 100, 440);

    // Delegation info if applicable
    if (result.delegation_name) {
      ctx.fillText(`Delegation: ${result.delegation_name}`, 100, 480);
      ctx.fillText(`Delegation Serial: ${result.delegation_serial}`, 100, 520);
    }

    // Try to convert the data URL to a Blob and download via object URL.
    // This is more compatible with mobile browsers and webviews (Instagram, etc.).
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `FIMMUN_Ticket_${ticket.serial_number}.png`;
      // Some webviews require the link to be added to the DOM
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke the object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      // Fallback: open the image in a new tab/window so user can long-press and save.
      const dataUrl = canvas.toDataURL('image/png');
      const opened = window.open(dataUrl, '_blank', 'noopener,noreferrer');
      if (!opened) {
        alert('Unable to download automatically. Please long-press the image and save it to your device.');
      }
    }
  };

  return (
    <>
      <Head>
        <title>Status Checker - FIMMUN 2025</title>
        <meta name="description" content="Check your FIMMUN registration status" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                FIMMUN 2025
              </Link>
              <Link 
                href="/" 
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Registration Status Checker
              </h1>
              <p className="text-gray-600">
                Enter your verification code to check your registration status and download your MUN ticket
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  placeholder="Enter your verification code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-wider"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-6">
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-lg font-semibold text-green-800">Registration Found</h3>
                  </div>

                  <div className="space-y-2 text-green-700">
                    <p><strong>Name:</strong> {result.name}</p>
                    <p><strong>Email:</strong> {result.email}</p>
                    <p><strong>Registration Type:</strong> {result.registration_type?.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        result.status === 'verified' 
                          ? 'bg-green-100 text-green-800' 
                          : result.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status?.toUpperCase()}
                      </span>
                    </p>
                    {result.delegation_name && (
                      <>
                        <p><strong>Delegation:</strong> {result.delegation_name}</p>
                        <p><strong>Delegation Serial:</strong> {result.delegation_serial}</p>
                      </>
                    )}
                  </div>
                </div>

                {result.status === 'verified' && result.serial_number && (
                  <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-blue-800">MUN Ticket Ready</h3>
                      <span className="text-2xl font-bold text-blue-600">{result.serial_number}</span>
                    </div>

                    <p className="text-blue-700 mb-4">
                      Your registration has been verified! You can now download your official MUN ticket.
                    </p>

                    <button
                      onClick={downloadTicket}
                      className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Download MUN Ticket
                    </button>
                  </div>
                )}

                {result.status === 'pending' && (
                  <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center mb-4">
                      <svg className="w-6 h-6 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-lg font-semibold text-yellow-800">Pending Verification</h3>
                    </div>

                    <p className="text-yellow-700">
                      Your registration is currently under review. Please wait for admin approval. 
                      You will receive your serial number once your registration is verified.
                    </p>
                  </div>
                )}

                {result.status === 'rejected' && (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center mb-4">
                      <svg className="w-6 h-6 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-lg font-semibold text-red-800">Registration Rejected</h3>
                    </div>

                    <p className="text-red-700">
                      Your registration has been rejected. Please contact the organizing committee for more information.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
