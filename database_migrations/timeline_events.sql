-- Create timeline_events table
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    event_type VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to active events
CREATE POLICY "Public can view active timeline events" ON timeline_events
    FOR SELECT USING (is_active = true);

-- Create policy for admin management (allow all operations for service role)
CREATE POLICY "Admins can manage all timeline events" ON timeline_events
    FOR ALL USING (true);

-- Insert sample timeline data
INSERT INTO timeline_events (day_number, date, title, description, start_time, end_time, location, event_type, is_active) VALUES
(1, '2025-11-21', 'Opening Ceremony', 'Welcome address and conference introduction', '09:00:00', '10:00:00', 'Main Auditorium', 'ceremony', true),
(1, '2025-11-21', 'Committee Session 1', 'First committee session - agenda setting', '10:30:00', '12:00:00', 'Committee Rooms', 'session', true),
(1, '2025-11-21', 'Lunch Break', 'Lunch and networking session', '12:00:00', '13:30:00', 'Dining Hall', 'break', true),
(1, '2025-11-21', 'Committee Session 2', 'Second committee session - debate begins', '13:30:00', '15:30:00', 'Committee Rooms', 'session', true),
(1, '2025-11-21', 'Coffee Break', 'Coffee and refreshments', '15:30:00', '16:00:00', 'Lobby', 'break', true),
(1, '2025-11-21', 'Committee Session 3', 'Third committee session - resolution drafting', '16:00:00', '18:00:00', 'Committee Rooms', 'session', true),

(2, '2025-11-22', 'Committee Session 4', 'Fourth committee session - resolution debate', '09:00:00', '11:00:00', 'Committee Rooms', 'session', true),
(2, '2025-11-22', 'Coffee Break', 'Coffee and refreshments', '11:00:00', '11:30:00', 'Lobby', 'break', true),
(2, '2025-11-22', 'Committee Session 5', 'Fifth committee session - voting', '11:30:00', '13:00:00', 'Committee Rooms', 'session', true),
(2, '2025-11-22', 'Lunch Break', 'Lunch and networking session', '13:00:00', '14:30:00', 'Dining Hall', 'break', true),
(2, '2025-11-22', 'Committee Session 6', 'Sixth committee session - final resolutions', '14:30:00', '16:30:00', 'Committee Rooms', 'session', true),
(2, '2025-11-22', 'Coffee Break', 'Coffee and refreshments', '16:30:00', '17:00:00', 'Lobby', 'break', true),
(2, '2025-11-22', 'Committee Session 7', 'Seventh committee session - wrap up', '17:00:00', '18:30:00', 'Committee Rooms', 'session', true),

(3, '2025-11-23', 'Committee Session 8', 'Final committee session - resolution presentations', '09:00:00', '11:00:00', 'Committee Rooms', 'session', true),
(3, '2025-11-23', 'Coffee Break', 'Coffee and refreshments', '11:00:00', '11:30:00', 'Lobby', 'break', true),
(3, '2025-11-23', 'General Assembly', 'General Assembly session - final presentations', '11:30:00', '13:00:00', 'Main Auditorium', 'session', true),
(3, '2025-11-23', 'Lunch Break', 'Lunch and networking session', '13:00:00', '14:30:00', 'Dining Hall', 'break', true),
(3, '2025-11-23', 'Awards Ceremony', 'Awards and recognition ceremony', '14:30:00', '16:00:00', 'Main Auditorium', 'ceremony', true),
(3, '2025-11-23', 'Closing Ceremony', 'Closing remarks and conference conclusion', '16:00:00', '17:00:00', 'Main Auditorium', 'ceremony', true);
