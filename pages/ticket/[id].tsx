import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';

interface TicketData {
  name: string;
  serial_number: string;
  registration_type: string;
  committee: string | null;
  event: string;
  date: string;
  location: string;
}

export default function Ticket() {
  const router = useRouter();
  const { id, type } = router.query;
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && type) {
      fetchTicket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/generate?id=${id}&type=${type}`);
      const data = await response.json();

      if (data.success) {
        setTicket(data.ticket);
      } else {
        setError(data.message || 'Failed to load ticket');
      }
    } catch (err) {
      setError('Failed to load ticket');
      console.error('Error fetching ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    // For now, we'll use the print dialog which allows "Save as PDF"
    // In production, you could use libraries like html2canvas + jsPDF for direct PDF generation
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>FIMMUN 2025 - Ticket - {ticket.serial_number}</title>
        <meta name="description" content="Your FIMMUN 2025 conference ticket" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 print:bg-white">
        {/* Action Buttons - Hidden when printing */}
        <div className="max-w-4xl mx-auto mb-6 flex justify-end gap-4 print:hidden">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Ticket
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>

        {/* Ticket Container */}
        <div className="max-w-4xl mx-auto">
          <div ref={ticketRef} className="bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none">
            {/* Ticket Header with Logo */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white rounded-full p-2">
                    <Image
                      src="/logo.png"
                      alt="FIMMUN Logo"
                      width={60}
                      height={60}
                      className="object-cover rounded-full"
                    />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">FIMMUN 2025</h1>
                    <p className="text-blue-100 text-sm">Forman International Model United Nations</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-xs text-blue-100 uppercase tracking-wider">Serial No.</p>
                    <p className="text-2xl font-bold text-white font-mono">{ticket.serial_number}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Body */}
            <div className="p-8">
              <div className="text-center space-y-4">
                {/* Participant Name */}
                <div>
                  <p className="text-xl font-semibold text-gray-700 mb-1">Name:</p>
                  <p className="text-2xl font-bold text-gray-900">{ticket.name}</p>
                </div>

                {/* Serial Number */}
                <div>
                  <p className="text-xl font-semibold text-gray-700 mb-1">Serial Number:</p>
                  <p className="text-2xl font-bold text-gray-900 font-mono">{ticket.serial_number}</p>
                </div>

                {/* Registration Type */}
                <div>
                  <p className="text-xl font-semibold text-gray-700 mb-1">Registration Type:</p>
                  <p className="text-2xl font-bold text-gray-900">{ticket.registration_type.toUpperCase()}</p>
                </div>

                {/* Committee */}
                <div>
                  <p className="text-xl font-semibold text-gray-700 mb-1">Committee:</p>
                  <p className="text-2xl font-bold text-gray-900">{ticket.committee || 'Not Assigned'}</p>
                </div>

                {/* Event */}
                <div>
                  <p className="text-xl font-semibold text-gray-700 mb-1">Event:</p>
                  <p className="text-2xl font-bold text-gray-900">{ticket.event}</p>
                </div>

                {/* Date */}
                <div>
                  <p className="text-xl font-semibold text-gray-700 mb-1">Date:</p>
                  <p className="text-2xl font-bold text-gray-900">{ticket.date}</p>
                </div>

                {/* Location */}
                <div>
                  <p className="text-xl font-semibold text-gray-700 mb-1">Location:</p>
                  <p className="text-2xl font-bold text-gray-900">{ticket.location}</p>
                </div>
              </div>

              {/* QR Code Placeholder and Instructions */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Important Instructions:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>Please bring a printed copy of this ticket or show it on your mobile device</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>Bring a valid ID card for verification</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>Arrive at least 30 minutes before the session starts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>Formal attire is required for all sessions</span>
                      </li>
                    </ul>
                  </div>
                  <div className="ml-6 text-center print:hidden">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <p className="text-xs text-gray-500">QR Code</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                For queries, contact: info@fimmun.org | This ticket is non-transferable and valid for the registered participant only
              </p>
            </div>
          </div>
        </div>

        {/* Back Button - Hidden when printing */}
        <div className="max-w-4xl mx-auto mt-6 text-center print:hidden">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Homepage
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
        }
      `}</style>
    </>
  );
}

