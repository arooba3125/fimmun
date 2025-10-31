import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import { requireAdminAuth } from '../../../lib/auth-helpers';

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; email: string } = { id: '', email: '' }) {
  const supabaseAdmin = createAdminClient();

  if (req.method === 'GET') {
    // Get all features
    try {
      const { data: features, error } = await supabaseAdmin
        .from('features')
        .select('*')
        .order('display_order');

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch features',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        features: features || []
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch features',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'POST') {
    // Create new feature
    const { 
      title, 
      description, 
      icon, 
      image_url,
      display_order 
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Feature title is required' });
    }

    try {
      const { data: newFeature, error: insertError } = await supabaseAdmin
        .from('features')
        .insert({
          title,
          description: description || null,
          icon: icon || null,
          image_url: image_url || null,
          is_active: true,
          display_order: display_order || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create feature',
          details: insertError.message
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Feature created successfully!',
        feature: newFeature
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Feature creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'PUT') {
    // Update feature
    const { 
      id, 
      title, 
      description, 
      icon, 
      image_url,
      is_active,
      display_order
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Feature ID is required' });
    }

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (icon !== undefined) updateData.icon = icon;
      if (image_url !== undefined) updateData.image_url = image_url;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (display_order !== undefined) updateData.display_order = display_order;

      const { data: updatedFeature, error: updateError } = await supabaseAdmin
        .from('features')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update feature',
          details: updateError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Feature updated successfully!',
        feature: updatedFeature
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Feature update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  if (req.method === 'DELETE') {
    // Delete feature
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Feature ID is required' });
    }

    try {
      const { error: deleteError } = await supabaseAdmin
        .from('features')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete feature',
          details: deleteError.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Feature deleted successfully!'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Feature deletion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

// Require authentication for POST, PUT, DELETE; allow public GET
export default async function wrappedHandler(req: NextApiRequest, res: NextApiResponse) {
  // Allow public access to GET requests (for homepage features display)
  if (req.method === 'GET') {
    return handler(req, res);
  }
  
  // Require admin auth for all other methods
  return requireAdminAuth(handler)(req, res);
}
