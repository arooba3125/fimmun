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
  console.log('Committee API request:', {
    method: req.method,
    headers: {
      authorization: req.headers.authorization ? 'present' : 'missing',
      contentType: req.headers['content-type']
    },
    body: req.body
  });

  // Verify admin authentication for all methods except GET
  if (req.method !== 'GET') {
    const authResult = verifyAdminToken(req);
    console.log('Auth verification result:', authResult);
    
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
      description, 
      capacity 
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Committee name is required' });
    }

    try {
      const { data: newCommittees, error: insertError } = await supabaseAdmin
        .from('committees')
        .insert({
          name,
          description: description || null,
          capacity: capacity || 30,
          current_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create committee',
          details: insertError.message
        });
      }

      if (!newCommittees || newCommittees.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create committee',
          details: 'No committee was created'
        });
      }

      const newCommittee = newCommittees[0];

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
      description, 
      capacity
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Committee ID is required' });
    }

    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (capacity !== undefined) updateData.capacity = capacity;

      // First, check if the committee exists (use array instead of single to avoid RLS issues)
      const { data: existingCommittees, error: findError } = await supabaseAdmin
        .from('committees')
        .select('id, name')
        .eq('id', id);

      console.log('Existing committee check:', { existingCommittees, findError, id });

      if (findError || !existingCommittees || existingCommittees.length === 0) {
        // Debug: Check if any committees exist at all
        const { data: allCommittees } = await supabaseAdmin
          .from('committees')
          .select('id, name')
          .limit(5);
        
        return res.status(404).json({
          success: false,
          error: 'Committee not found',
          details: `No committee found with ID: ${id}`,
          debug: {
            requestedId: id,
            findError: findError?.message,
            totalCommitteesInDB: allCommittees?.length || 0,
            sampleCommitteeIds: allCommittees?.map(c => c.id) || [],
            sampleCommitteeNames: allCommittees?.map(c => c.name) || []
          }
        });
      }

      const existingCommittee = existingCommittees[0];

      const { data: updatedCommittees, error: updateError } = await supabaseAdmin
        .from('committees')
        .update(updateData)
        .eq('id', id)
        .select();

      if (updateError) {
        console.error('Committee update error:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update committee',
          details: updateError.message,
          debug: {
            updateData,
            id,
            errorCode: updateError.code
          }
        });
      }

      if (!updatedCommittees || updatedCommittees.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'Update operation failed',
          details: `Committee exists but update returned no results for ID: ${id}`,
          debug: {
            requestedId: id,
            updateData,
            existingCommittee
          }
        });
      }

      const updatedCommittee = updatedCommittees[0];

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
    // Note: Authentication already verified at the top of the function

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