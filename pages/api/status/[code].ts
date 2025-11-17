import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Verification code is required'
    });
  }

  const supabaseAdmin = createAdminClient();

  try {
    // Check all registration tables for the verification code
    const [privateDelegateResult, observerResult, alumniResult, delegationMemberResult] = await Promise.all([
      supabaseAdmin
        .from('private_delegates')
        .select('*')
        .eq('verification_code', code)
        .single(),
      
      supabaseAdmin
        .from('observers')
        .select('*')
        .eq('verification_code', code)
        .single(),
      
      supabaseAdmin
        .from('alumni')
        .select('*')
        .eq('verification_code', code)
        .single(),
      
      supabaseAdmin
        .from('delegation_members')
        .select(`
          *,
          delegations (
            delegation_name,
            delegation_serial
          )
        `)
        .eq('verification_code', code)
        .single()
    ]);

    // Find which registration matches
    let registration = null;
    let registrationType = null;

    if (privateDelegateResult.data && !privateDelegateResult.error) {
      registration = privateDelegateResult.data;
      registrationType = 'private_delegate';
    } else if (observerResult.data && !observerResult.error) {
      registration = observerResult.data;
      registrationType = 'observer';
    } else if (alumniResult.data && !alumniResult.error) {
      registration = alumniResult.data;
      registrationType = 'alumni';
    } else if (delegationMemberResult.data && !delegationMemberResult.error) {
      registration = delegationMemberResult.data;
      registrationType = 'delegation_member';
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Return registration status
    const response: Record<string, unknown> = {
      success: true,
      registration_type: registrationType,
      name: registration.name,
      email: registration.email,
      status: registration.status,
      created_at: registration.created_at
    };

    // Add serial number if verified
    if (registration.status === 'verified') {
      // For delegation members, the serial number may be stored on the member
      // record or on the related delegation. Prefer the member serial, but
      // fall back to the delegation serial so members can download tickets.
      const memberSerial = (registration as { serial_number?: string }).serial_number;
      const delegationSerial = registration.delegations ? registration.delegations.delegation_serial : undefined;
      const effectiveSerial = memberSerial || delegationSerial;

      if (effectiveSerial) {
        response.serial_number = effectiveSerial;

        // Generate MUN ticket data
        response.mun_ticket = {
          name: registration.name,
          serial_number: effectiveSerial,
          registration_type: registrationType,
          event_name: 'FIMMUN 2025',
          date: 'December 5-7, 2025',
          location: 'Fazaia Inter College Minhas, Pakistan'
        };

        // Add delegation info for delegation members
        if (registrationType === 'delegation_member' && registration.delegations) {
          response.delegation_name = registration.delegations.delegation_name;
          response.delegation_serial = registration.delegations.delegation_serial;
        }
      }
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
