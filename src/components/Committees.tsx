'use client';

import { useEffect, useState } from 'react';
import { Committee } from '../../lib/supabaseClient';
import { MUN_CONSTANTS } from '../lib/constants';

interface CommitteeModalProps {
  committee: Committee | null;
  isOpen: boolean;
  onClose: () => void;
}

function getCommitteeDescription(committeeName: string): string {
  const descriptions: { [key: string]: string } = {
    "United Nations Security Council": "The UN Security Council is the most prestigious committee at FIMMUN, dealing with matters of international peace and security. Delegates will engage in high-level diplomatic negotiations, crisis management, and decision-making processes that shape global politics. This committee is perfect for experienced delegates who want to tackle complex international issues and develop advanced diplomatic skills.",
    
    "Pakistan National Assembly": "Experience the dynamics of Pakistani politics in this specialized committee. Delegates will debate domestic policy issues, legislative processes, and governance challenges facing Pakistan. This committee offers a unique perspective on parliamentary democracy and provides delegates with insights into national policymaking and political processes.",
    
    "United Nations Human Rights Council": "Focus on promoting and protecting human rights worldwide in this important committee. Delegates will address contemporary human rights challenges, draft resolutions, and work towards creating a more just and equitable world. This committee is ideal for delegates passionate about social justice and human dignity.",
    
    "Special Crisis Committee": "Navigate through unexpected crises and emergency situations in this dynamic committee. Delegates will face time-sensitive challenges that require quick thinking, strategic planning, and effective communication under pressure. This committee is perfect for delegates who thrive in fast-paced, unpredictable environments.",
    
    "Commission on the Status of Women": "Advocate for gender equality and women's rights in this dedicated committee. Delegates will address issues affecting women and girls globally, working towards achieving gender parity and empowerment. This committee is ideal for delegates interested in social justice and gender issues.",
    
    "Organization of Islamic Cooperation": "Represent the interests of the Muslim world in this specialized committee. Delegates will address issues affecting Islamic countries, promote cooperation among member states, and work towards common goals. This committee offers insights into Islamic diplomacy and interfaith dialogue.",
    
    "Disarmament and International Security Committee": "Tackle global security challenges and arms control issues in this critical committee. Delegates will work on nuclear disarmament, conventional weapons control, and international security measures. This committee is perfect for delegates interested in international security and conflict resolution."
  };
  
  return descriptions[committeeName] || "This committee provides an excellent opportunity to develop diplomatic skills, engage in meaningful debate, and contribute to important global discussions. Delegates will gain valuable experience in international relations, public speaking, and collaborative problem-solving while addressing contemporary global challenges.";
}

function CommitteeModal({ committee, isOpen, onClose }: CommitteeModalProps) {
  if (!isOpen || !committee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{committee.name}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Committee Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Capacity</h4>
                <p className="text-2xl font-bold text-blue-600">{committee.capacity}</p>
                <p className="text-sm text-blue-700">Total Delegates</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Current</h4>
                <p className="text-2xl font-bold text-green-600">{committee.current_count}</p>
                <p className="text-sm text-green-700">Verified Delegates</p>
              </div>
            </div>

            {/* Committee Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">About This Committee</h4>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700 leading-relaxed">
                  {getCommitteeDescription(committee.name)}
                </p>
              </div>
            </div>

            {/* Committee Features */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Committee Features</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-600">Expert chairing and guidance</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-600">Comprehensive background guides</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-600">Realistic UN procedures</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-600">Interactive debate sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-600">Networking opportunities</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-600">Certificate of participation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-600">Awards and recognition</span>
                </div>
              </div>
            </div>

            {/* Skills Developed */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Skills You&apos;ll Develop</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600">Public Speaking</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600">Negotiation</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600">Critical Thinking</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600">Research Skills</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600">Leadership</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600">Teamwork</span>
                </div>
              </div>
            </div>

            {/* Registration Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Registration Status</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  {committee.current_count} of {committee.capacity} spots filled
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  committee.current_count >= committee.capacity 
                    ? 'bg-red-100 text-red-800' 
                    : committee.current_count >= committee.capacity * 0.8 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                }`}>
                  {committee.current_count >= committee.capacity 
                    ? 'Full' 
                    : committee.current_count >= committee.capacity * 0.8 
                      ? 'Almost Full'
                      : 'Available'
                  }
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    committee.current_count >= committee.capacity 
                      ? 'bg-red-500' 
                      : committee.current_count >= committee.capacity * 0.8 
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((committee.current_count / committee.capacity) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                onClose();
                const element = document.getElementById('registration');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Register Now
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Committees() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCommittees();
  }, []);

  const fetchCommittees = async () => {
    try {
      // Fetch from committee registration caps API
      const response = await fetch('/api/admin/committee-registration-caps');
      const data = await response.json();
      
      if (data.success && data.caps) {
        // Transform the caps data to match Committee interface
        const committeesData = data.caps.map((cap: {
          id: string;
          committee_name: string;
          max_capacity: number;
          current_count: number;
          created_at: string;
          updated_at: string;
        }) => ({
          id: cap.id,
          name: cap.committee_name,
          description: getCommitteeDescription(cap.committee_name),
          capacity: cap.max_capacity,
          current_count: cap.current_count,
          created_at: cap.created_at,
          updated_at: cap.updated_at,
        }));
        setCommittees(committeesData);
      } else {
        throw new Error('Failed to fetch committee data');
      }
    } catch (error) {
      console.error('Error fetching committees:', error);
      // Fallback to constants if database fails
      setCommittees(MUN_CONSTANTS.committees.map((committee, index) => ({
        id: index.toString(),
        name: committee.name,
        description: committee.topic,
        capacity: 30,
        current_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })));
    }
    setLoading(false);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openModal = (committee: Committee) => {
    setSelectedCommittee(committee);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCommittee(null);
  };

  if (loading) {
    return (
      <section id="committees" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading committees...</p>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="committees" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our <span className="text-blue-600">Committees</span>
          </h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience authentic United Nations simulations across our diverse range of specialized committees
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {committees.map((committee) => (
            <div key={committee.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {committee.name}
                    </h3>
                  </div>
                  <div className="ml-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </div>
                </div>
                
                {committee.description && (
                  <div className="mb-6">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {committee.description}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Capacity: {committee.capacity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Current: {committee.current_count}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-600">Expert chairing and guidance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-600">Comprehensive background guides</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-600">Realistic UN procedures</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => openModal(committee)}
                  className="w-full mt-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300"
                >
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Ready to make your mark in international diplomacy?
          </p>
          <button 
            onClick={() => scrollToSection('registration')}
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-lg"
          >
            Register for Committee
          </button>
        </div>

        {/* Committee Modal */}
        <CommitteeModal 
          committee={selectedCommittee} 
          isOpen={isModalOpen} 
          onClose={closeModal} 
        />
      </div>
    </section>
  );
}
