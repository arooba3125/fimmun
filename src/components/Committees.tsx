'use client';

import { useEffect, useState } from 'react';
import { supabase, Committee } from '../../lib/supabaseClient';
import { MUN_CONSTANTS } from '../lib/constants';

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
        .order('created_at');
      
      if (error) throw error;
      setCommittees(data || []);
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
                    <p className="text-blue-600 font-semibold mb-4">
                      {committee.description || 'Description will be announced soon'}
                    </p>
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
