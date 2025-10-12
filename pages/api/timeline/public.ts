import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

interface TimelineEvent {
  day_number: number;
  date: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { data: events, error } = await supabase
      .from('timeline_events')
      .select('day_number, date, title, description, start_time, end_time, location, event_type')
      .eq('is_active', true)
      .order('day_number', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch timeline events',
        details: error.message
      });
    }

    // Group events by day
    const eventsByDay = events?.reduce((acc, event) => {
      const dayKey = `day_${event.day_number}`;
      if (!acc[dayKey]) {
        acc[dayKey] = {
          day_number: event.day_number,
          date: event.date,
          events: []
        };
      }
      acc[dayKey].events.push(event);
      return acc;
    }, {} as Record<string, { day_number: number; date: string; events: TimelineEvent[] }>) || {};

    return res.status(200).json({
      success: true,
      timeline: Object.values(eventsByDay)
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline events',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
