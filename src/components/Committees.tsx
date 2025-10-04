'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { MUN_CONSTANTS } from '../lib/constants';

interface Committee {
  id: string;
  name: string;
  short_name: string | null;
  topic: string | null;
  description: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null;
  max_delegates: number;
  current_delegates: number;
  chair_name: string | null;
  chair_email: string | null;
  is_active: boolean;
}

export default function Committees() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommittees();
  }, []);

  const fetchCommittees = async () => {
    try {
      const { data, error } = await supabase
        .from('committees')
        .select('*')
        .eq('is_active', true)
        .order('created_at');
      
      if (error) throw error;
      setCommittees(data || []);
    } catch (error) {
      console.error('Error fetching committees:', error);
      // Fallback to constants if database fails
      setCommittees(MUN_CONSTANTS.committees.map((committee, index) => ({
        id: index.toString(),
        name: committee.name,
        short_name: null,
        topic: committee.topic,
        description: null,
        difficulty_level: committee.difficulty.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
        max_delegates: 30,
        current_delegates: 0,
        chair_name: null,
        chair_email: null,
        is_active: true,
      })));
    }
    setLoading(false);
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
                    {committee.short_name && (
                      <p className="text-blue-600 font-semibold text-sm mb-2">
                        {committee.short_name}
                      </p>
                    )}
                    <p className="text-blue-600 font-semibold mb-4">
                      {committee.topic || 'Topic will be announced soon'}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      committee.difficulty_level === 'advanced' 
                        ? 'bg-red-100 text-red-800' 
                        : committee.difficulty_level === 'intermediate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {committee.difficulty_level ? committee.difficulty_level.charAt(0).toUpperCase() + committee.difficulty_level.slice(1) : 'Not Set'}
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
                      Max Delegates: {committee.max_delegates}
                    </span>
                  </div>
                  {committee.chair_name && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Chair: {committee.chair_name}
                      </span>
                    </div>
                  )}
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
                
                <button className="w-full mt-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300">
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
          <button className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-lg">
            Register for Committee
          </button>
        </div>
      </div>
    </section>
  );
}
