import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '../../../lib/supabaseClient';
import { requireAdminAuth } from '../../../lib/auth-helpers';

interface TicketData {
  name: string;
  serial_number: string;
  registration_type: string;
  committee: string | null;
  committees: string[];
  cnic: string | null;
  event: string;
  date: string;
  location: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, type } = req.query;

  if (!id || !type) {
    return res.status(400).json({ message: 'ID and type are required' });
  }

  const supabaseAdmin = createAdminClient();

  try {
    let ticketData: TicketData | null = null;

    // Fetch data based on registration type
    switch (type) {
      case 'private-delegate': {
        const { data, error } = await supabaseAdmin
          .from('private_delegates')
          .select('name, serial_number, committee_preferences, cnic')
          .eq('id', id)
          .eq('status', 'verified')
          .single();

        if (error || !data) {
          return res.status(404).json({ message: 'Delegate not found or not verified' });
        }

        ticketData = {
          name: data.name,
          serial_number: data.serial_number,
          registration_type: 'Private Delegate',
          committee: data.committee_preferences?.[0] || null,
          committees: data.committee_preferences || [],
          cnic: data.cnic || null,
          event: 'FIMMUN 2025',
          date: 'TBD', // You can update this with actual event dates
          location: 'Forman Christian College, Lahore'
        };
        break;
      }

      case 'delegation-member': {
        const { data, error } = await supabaseAdmin
          .from('delegation_members')
          .select('name, serial_number, committee_preference, cnic')
          .eq('id', id)
          .eq('status', 'verified')
          .single();

        if (error || !data) {
          return res.status(404).json({ message: 'Delegation member not found or not verified' });
        }

        ticketData = {
          name: data.name,
          serial_number: data.serial_number,
          registration_type: 'Delegation Member',
          committee: data.committee_preference || null,
          committees: data.committee_preference ? [data.committee_preference] : [],
          cnic: data.cnic || null,
          event: 'FIMMUN 2025',
          date: 'TBD',
          location: 'Forman Christian College, Lahore'
        };
        break;
      }

      case 'observer': {
        const { data, error } = await supabaseAdmin
          .from('observers')
          .select('name, serial_number, cnic')
          .eq('id', id)
          .eq('status', 'verified')
          .single();

        if (error || !data) {
          return res.status(404).json({ message: 'Observer not found or not verified' });
        }

        ticketData = {
          name: data.name,
          serial_number: data.serial_number,
          registration_type: 'Observer',
          committee: 'All Sessions',
          committees: ['All Sessions'],
          cnic: data.cnic || null,
          event: 'FIMMUN 2025',
          date: 'TBD',
          location: 'Forman Christian College, Lahore'
        };
        break;
      }

      case 'alumni': {
        const { data, error } = await supabaseAdmin
          .from('alumni')
          .select('name, serial_number, cnic')
          .eq('id', id)
          .eq('status', 'verified')
          .single();

        if (error || !data) {
          return res.status(404).json({ message: 'Alumni not found or not verified' });
        }

        ticketData = {
          name: data.name,
          serial_number: data.serial_number,
          registration_type: 'Alumni',
          committee: 'Alumni Events',
          committees: ['Alumni Events'],
          cnic: data.cnic || null,
          event: 'FIMMUN 2025',
          date: 'TBD',
          location: 'Forman Christian College, Lahore'
        };
        break;
      }

      default:
        return res.status(400).json({ message: 'Invalid registration type' });
    }

    if (!ticketData || !ticketData.serial_number) {
      return res.status(400).json({ message: 'Serial number not assigned yet' });
    }

    return res.status(200).json({
      success: true,
      ticket: ticketData
    });

  } catch (error) {
    console.error('Error generating ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Tickets contain sensitive data, require admin authentication
export default requireAdminAuth(handler);

