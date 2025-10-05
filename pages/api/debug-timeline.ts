import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = createAdminClient();
    
    // Test 1: Check if we can read events
    const { data: events, error: readError } = await supabaseAdmin
      .from('timeline_events')
      .select('id, title, day_number')
      .limit(3);

    // Test 2: Check if we can update an event (if any exist)
    let updateTest = null;
    if (events && events.length > 0) {
      const testEvent = events[0];
      const { data: updateResult, error: updateError } = await supabaseAdmin
        .from('timeline_events')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testEvent.id)
        .select('id, title, updated_at');
      
      updateTest = {
        success: !updateError,
        error: updateError?.message,
        result: updateResult
      };
    }

    // Test 3: Check RLS status
    const { data: rlsInfo, error: rlsError } = await supabaseAdmin
      .from('timeline_events')
      .select('*')
      .limit(1);

    return res.status(200).json({
      success: true,
      debug: {
        serviceRoleConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        readTest: {
          success: !readError,
          error: readError?.message,
          eventsCount: events?.length || 0,
          sampleEvents: events || []
        },
        updateTest,
        rlsTest: {
          success: !rlsError,
          error: rlsError?.message,
          canAccess: !!rlsInfo
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
