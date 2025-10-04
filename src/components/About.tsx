'use client';

import { useEffect, useState } from 'react';
import { supabase, Feature } from '../../lib/supabaseClient';
import { MUN_CONSTANTS } from '@/lib/constants';

export default function About() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error fetching features:', error);
      // Fallback to constants if database fails
      setFeatures(MUN_CONSTANTS.features.map((feature, index) => ({
        id: index.toString(),
        title: feature.title,
        description: feature.description,
        icon: feature.icon,
        order_index: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })));
    }
    setLoading(false);
  };
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About <span className="text-blue-600">{MUN_CONSTANTS.shortName}</span>
          </h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {MUN_CONSTANTS.description}
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="text-center animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            features.map((feature) => (
              <div key={feature.id} className="text-center group">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {feature.icon || '🏛️'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description || 'Feature description coming soon.'}
                </p>
              </div>
            ))
          )}
        </div>
        
        {/* Statistics */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-4">Conference at a Glance</h3>
            <p className="text-blue-100">Join hundreds of delegates for an unforgettable experience</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {MUN_CONSTANTS.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-blue-200 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
