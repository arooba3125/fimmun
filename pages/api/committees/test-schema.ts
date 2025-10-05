import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabaseAdmin = createAdminClient();
    
    // Test 1: Check if committees table exists and get its structure
    const { data: committees, error } = await supabaseAdmin
      .from('committees')
      .select('*')
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to access committees table',
        details: error.message,
        code: error.code
      });
    }

    // Test 2: Try to get table schema information
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'committees' })
      .single();

    // Test 3: List all committees with their structure
    const { data: allCommittees, error: listError } = await supabaseAdmin
      .from('committees')
      .select('*')
      .limit(5);

    return res.status(200).json({
      success: true,
      debug: {
        serviceRoleConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        committeesTableAccess: {
          success: !error,
          error: error?.message,
          sampleCommittee: committees?.[0] || null,
          committeeFields: committees?.[0] ? Object.keys(committees[0]) : []
        },
        tableSchema: {
          success: !tableError,
          error: tableError?.message,
          info: tableInfo
        },
        allCommittees: {
          success: !listError,
          error: listError?.message,
          count: allCommittees?.length || 0,
          committees: allCommittees || []
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Schema test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
