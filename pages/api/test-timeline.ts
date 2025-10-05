import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = createAdminClient();
    
    // Test basic connection and get all events
    const { data: events, error } = await supabaseAdmin
      .from('timeline_events')
      .select('id, title, day_number, date, event_type, is_active')
      .order('day_number', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        details: error.message,
        code: error.code
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      eventsCount: events?.length || 0,
      events: events || []
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
