import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabaseAdmin = createAdminClient();

  if (req.method === 'GET') {
    // Get all committees
    try {
      const { data: committees, error } = await supabaseAdmin
        .from('committees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch committees',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        committees: committees || []
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch committees',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'POST') {
    // Create new committee
    const { 
      name, 
      short_name, 
      topic, 
      description, 
      difficulty_level, 
      max_delegates, 
      chair_name, 
      chair_email 
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Committee name is required' });
    }

    try {
      const { data: newCommittee, error: insertError } = await supabaseAdmin
        .from('committees')
        .insert({
          name,
          short_name: short_name || null,
          topic: topic || null,
          description: description || null,
          difficulty_level: difficulty_level || 'intermediate',
          max_delegates: max_delegates || 30,
          current_delegates: 0,
          chair_name: chair_name || null,
          chair_email: chair_email || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create committee',
          details: insertError.message
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Committee created successfully!',
        committee: newCommittee
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Committee creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    // Update committee
    const { 
      id, 
      name, 
      short_name, 
      topic, 
      description, 
      difficulty_level, 
      max_delegates, 
      chair_name, 
      chair_email,
      is_active
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Committee ID is required' });
    }

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (name) updateData.name = name;
      if (short_name !== undefined) updateData.short_name = short_name;
      if (topic !== undefined) updateData.topic = topic;
      if (description !== undefined) updateData.description = description;
      if (difficulty_level) updateData.difficulty_level = difficulty_level;
      if (max_delegates !== undefined) updateData.max_delegates = max_delegates;
      if (chair_name !== undefined) updateData.chair_name = chair_name;
      if (chair_email !== undefined) updateData.chair_email = chair_email;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data: updatedCommittee, error: updateError } = await supabaseAdmin
        .from('committees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update committee',
          details: updateError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Committee updated successfully!',
        committee: updatedCommittee
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Committee update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'DELETE') {
    // Delete committee
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Committee ID is required' });
    }

    try {
      const { error: deleteError } = await supabaseAdmin
        .from('committees')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete committee',
          details: deleteError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Committee deleted successfully!'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Committee deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}