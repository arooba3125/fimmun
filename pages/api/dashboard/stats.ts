import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabaseAdmin = createAdminClient();

  try {
    // Get registration counts
    const [
      privateDelegatesResult,
      observersResult,
      alumniResult,
      delegationsResult,
      delegationMembersResult,
      capsResult
    ] = await Promise.all([
      supabaseAdmin
        .from('private_delegates')
        .select('status')
        .eq('status', 'verified'),
      
      supabaseAdmin
        .from('observers')
        .select('status')
        .eq('status', 'verified'),
      
      supabaseAdmin
        .from('alumni')
        .select('status')
        .eq('status', 'verified'),
      
      supabaseAdmin
        .from('delegations')
        .select('status')
        .eq('status', 'verified'),
      
      supabaseAdmin
        .from('delegation_members')
        .select('status')
        .eq('status', 'verified'),
      
      supabaseAdmin
        .from('registration_caps')
        .select('*')
        .order('category')
    ]);

    // Get pending counts
    const [
      pendingPrivateDelegatesResult,
      pendingObserversResult,
      pendingAlumniResult,
      pendingDelegationsResult,
      pendingDelegationMembersResult
    ] = await Promise.all([
      supabaseAdmin
        .from('private_delegates')
        .select('status')
        .eq('status', 'pending'),
      
      supabaseAdmin
        .from('observers')
        .select('status')
        .eq('status', 'pending'),
      
      supabaseAdmin
        .from('alumni')
        .select('status')
        .eq('status', 'pending'),
      
      supabaseAdmin
        .from('delegations')
        .select('status')
        .eq('status', 'pending'),
      
      supabaseAdmin
        .from('delegation_members')
        .select('status')
        .eq('status', 'pending')
    ]);

    // Calculate totals - separate private delegates from delegation members
    const totalVerifiedPrivateDelegates = privateDelegatesResult.data?.length || 0;
    const totalVerifiedDelegationMembers = delegationMembersResult.data?.length || 0;
    const totalVerifiedDelegates = totalVerifiedPrivateDelegates + totalVerifiedDelegationMembers; // Combined for registration caps
    const totalVerifiedObservers = observersResult.data?.length || 0;
    const totalVerifiedAlumni = alumniResult.data?.length || 0;
    const totalVerifiedDelegations = delegationsResult.data?.length || 0;

    const totalPendingPrivateDelegates = pendingPrivateDelegatesResult.data?.length || 0;
    const totalPendingDelegationMembers = pendingDelegationMembersResult.data?.length || 0;
    const totalPendingDelegates = totalPendingPrivateDelegates + totalPendingDelegationMembers; // Combined for total pending
    const totalPendingObservers = pendingObserversResult.data?.length || 0;
    const totalPendingAlumni = pendingAlumniResult.data?.length || 0;
    const totalPendingDelegations = pendingDelegationsResult.data?.length || 0;

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      recentPrivateDelegatesResult,
      recentObserversResult,
      recentAlumniResult,
      recentDelegationsResult,
      recentDelegationMembersResult
    ] = await Promise.all([
      supabaseAdmin
        .from('private_delegates')
        .select('created_at, name, email')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5),
      
      supabaseAdmin
        .from('observers')
        .select('created_at, name, email')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5),
      
      supabaseAdmin
        .from('alumni')
        .select('created_at, name, email')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5),
      
      supabaseAdmin
        .from('delegations')
        .select('created_at, delegation_name, head_delegate_email')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5),
      
      supabaseAdmin
        .from('delegation_members')
        .select('created_at, name, email')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    // Combine recent registrations
    const recentRegistrations = [
      ...(recentPrivateDelegatesResult.data || []).map(item => ({ ...item, type: 'Private Delegate' })),
      ...(recentObserversResult.data || []).map(item => ({ ...item, type: 'Observer' })),
      ...(recentAlumniResult.data || []).map(item => ({ ...item, type: 'Alumni' })),
      ...(recentDelegationsResult.data || []).map(item => ({ ...item, type: 'Delegation', name: item.delegation_name, email: item.head_delegate_email })),
      ...(recentDelegationMembersResult.data || []).map(item => ({ ...item, type: 'Delegation Member' }))
    ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

    // Calculate caps and availability
    const caps = capsResult.data || [];
    const delegateCap = caps.find(cap => cap.category === 'delegates');
    const observerCap = caps.find(cap => cap.category === 'observers');
    const alumniCap = caps.find(cap => cap.category === 'alumni');

    const stats = {
      verified: {
        private_delegates: totalVerifiedPrivateDelegates,
        delegates: totalVerifiedDelegates, // Combined count for registration caps
        observers: totalVerifiedObservers,
        alumni: totalVerifiedAlumni,
        delegations: totalVerifiedDelegations,
        delegation_members: totalVerifiedDelegationMembers,
        total: totalVerifiedDelegates + totalVerifiedObservers + totalVerifiedAlumni
      },
      pending: {
        private_delegates: totalPendingPrivateDelegates,
        delegates: totalPendingDelegates, // Combined count for total pending
        observers: totalPendingObservers,
        alumni: totalPendingAlumni,
        delegations: totalPendingDelegations,
        delegation_members: totalPendingDelegationMembers,
        total: totalPendingDelegates + totalPendingObservers + totalPendingAlumni
      },
      caps: {
        delegates: {
          current: delegateCap?.current_count || 0,
          max: delegateCap?.max_count || 350,
          available: (delegateCap?.max_count || 350) - (delegateCap?.current_count || 0)
        },
        observers: {
          current: observerCap?.current_count || 0,
          max: observerCap?.max_count || 150,
          available: (observerCap?.max_count || 150) - (observerCap?.current_count || 0)
        },
        alumni: {
          current: alumniCap?.current_count || 0,
          max: alumniCap?.max_count || 100,
          available: (alumniCap?.max_count || 100) - (alumniCap?.current_count || 0)
        }
      },
      recent_registrations: recentRegistrations
    };

    return res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
