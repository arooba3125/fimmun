import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Helper function to verify admin token
function verifyAdminToken(req: NextApiRequest): { isValid: boolean; adminId?: string; error?: string } {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'No authorization token provided' };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'fallback-secret') as JwtPayload;
    return { isValid: true, adminId: decoded.id };
  } catch (error) {
    return { isValid: false, error: 'Invalid or expired token' };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify admin authentication for all methods except GET
  if (req.method !== 'GET') {
    const authResult = verifyAdminToken(req);
    if (!authResult.isValid) {
      return res.status(401).json({
        success: false,
        error: authResult.error || 'Authentication required'
      });
    }
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = createAdminClient();
  } catch (error) {
    console.error('Supabase client creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  if (req.method === 'GET') {
    // Get all timeline events
    try {
      const { data: events, error } = await supabaseAdmin
        .from('timeline_events')
        .select('*')
        .order('day_number', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch timeline events',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        events: events || []
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch timeline events',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'POST') {
    // Create new timeline event
    const { 
      day_number, 
      date, 
      title, 
      description, 
      start_time, 
      end_time, 
      location, 
      event_type,
      is_active = true 
    } = req.body;

    if (!day_number || !date || !title) {
      return res.status(400).json({ 
        success: false,
        error: 'Day number, date, and title are required' 
      });
    }

    try {
      const { data: newEvents, error: insertError } = await supabaseAdmin
        .from('timeline_events')
        .insert({
          day_number,
          date,
          title,
          description: description || null,
          start_time: start_time || null,
          end_time: end_time || null,
          location: location || null,
          event_type: event_type || 'general',
          is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create timeline event',
          details: insertError.message
        });
      }

      if (!newEvents || newEvents.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create timeline event',
          details: 'No event was created'
        });
      }

      const newEvent = newEvents[0];

      return res.status(201).json({
        success: true,
        message: 'Timeline event created successfully!',
        event: newEvent
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Timeline event creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    // Update timeline event
    const { 
      id, 
      day_number, 
      date, 
      title, 
      description, 
      start_time, 
      end_time, 
      location, 
      event_type,
      is_active 
    } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        error: 'Event ID is required' 
      });
    }

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (day_number !== undefined) updateData.day_number = day_number;
      if (date !== undefined) updateData.date = date;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (start_time !== undefined) updateData.start_time = start_time;
      if (end_time !== undefined) updateData.end_time = end_time;
      if (location !== undefined) updateData.location = location;
      if (event_type !== undefined) updateData.event_type = event_type;
      if (is_active !== undefined) updateData.is_active = is_active;

      // First, check if the event exists (bypass RLS for service role)
      const { data: existingEvent, error: findError } = await supabaseAdmin
        .from('timeline_events')
        .select('id, title')
        .eq('id', id)
        .single();

      console.log('Existing event check:', { existingEvent, findError, id });

      if (findError || !existingEvent) {
        // Debug: Check if any events exist at all
        const { data: allEvents } = await supabaseAdmin
          .from('timeline_events')
          .select('id, title')
          .limit(5);
        
        return res.status(404).json({
          success: false,
          error: 'Timeline event not found',
          details: `No event found with ID: ${id}`,
          debug: {
            requestedId: id,
            findError: findError?.message,
            totalEventsInDB: allEvents?.length || 0,
            sampleEventIds: allEvents?.map(e => e.id) || [],
            sampleEventTitles: allEvents?.map(e => e.title) || []
          }
        });
      }

      const { data: updatedEvents, error: updateError } = await supabaseAdmin
        .from('timeline_events')
        .update(updateData)
        .eq('id', id)
        .select();

      if (updateError) {
        console.error('Timeline update error:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update timeline event',
          details: updateError.message,
          debug: {
            updateData,
            id,
            errorCode: updateError.code
          }
        });
      }

      if (!updatedEvents || updatedEvents.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'Update operation failed',
          details: `Event exists but update returned no results for ID: ${id}`,
          debug: {
            requestedId: id,
            updateData,
            existingEvent
          }
        });
      }

      const updatedEvent = updatedEvents[0];

      return res.status(200).json({
        success: true,
        message: 'Timeline event updated successfully!',
        event: updatedEvent
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Timeline event update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'DELETE') {
    // Delete timeline event
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        error: 'Event ID is required' 
      });
    }

    try {
      const { error: deleteError } = await supabaseAdmin
        .from('timeline_events')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Timeline delete error:', deleteError);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete timeline event',
          details: deleteError.message,
          debug: {
            id,
            errorCode: deleteError.code
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Timeline event deleted successfully!'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Timeline event deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ 
    success: false,
    error: 'Method not allowed' 
  });
}
