// src/components/Schedule.tsx
'use client';

import { useState, useEffect } from 'react';

interface TimelineEvent {
  day_number: number;
  date: string;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  event_type: string;
}

interface TimelineDay {
  day_number: number;
  date: string;
  events: TimelineEvent[];
}

export default function Schedule() {
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const response = await fetch('/api/timeline/public');
      const data = await response.json();
      
      if (data.success) {
        setTimeline(data.timeline);
      } else {
        setError(data.error || 'Failed to fetch timeline');
      }
    } catch {
      setError('Failed to fetch timeline');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="schedule" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading schedule...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="schedule" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Conference <span className="text-blue-600">Schedule</span>
          </h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Three days of intensive diplomacy, debate, and international cooperation
          </p>
        </div>
        
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load schedule</p>
            <button 
              onClick={fetchTimeline}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Schedule will be revealed soon</p>
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
              <span className="text-blue-600 text-sm">Will be revealed soon</span>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {timeline.map((day) => (
              <div key={day.day_number} className="bg-gray-50 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{day.day_number}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Day {day.day_number} - {day.date}</h3>
                    <p className="text-gray-600">Full day of committee sessions and activities</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {day.events.map((event, eventIndex) => (
                    <div key={eventIndex} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm mb-1">
                            {event.title}
                          </p>
                          {event.description && (
                            <p className="text-gray-600 text-xs mb-2">
                              {event.description}
                            </p>
                          )}
                          {event.start_time && event.end_time && (
                            <p className="text-blue-600 text-xs font-medium">
                              {event.start_time} - {event.end_time}
                            </p>
                          )}
                          {event.location && (
                            <p className="text-gray-500 text-xs">
                              📍 {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}