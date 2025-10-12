-- Create a table to track serial number counters for each category
-- This ensures atomic increments and prevents duplicate serial numbers

CREATE TABLE IF NOT EXISTS public.serial_numbers_counter (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  current_number integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT serial_numbers_counter_pkey PRIMARY KEY (id),
  CONSTRAINT serial_numbers_counter_category_unique UNIQUE (category)
) TABLESPACE pg_default;

-- Initialize counters for each category
INSERT INTO serial_numbers_counter (category, current_number) VALUES
('OD', 0),  -- Delegates
('OO', 0),  -- Observers
('OA', 0)   -- Alumni
ON CONFLICT (category) DO NOTHING;

-- Create a function to atomically get and increment the serial number
CREATE OR REPLACE FUNCTION get_next_serial_number(cat text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_num integer;
  serial_num text;
BEGIN
  -- Lock the row for this category and increment
  UPDATE serial_numbers_counter
  SET current_number = current_number + 1,
      updated_at = NOW()
  WHERE category = cat
  RETURNING current_number INTO next_num;
  
  -- Format the serial number with leading zeros (e.g., OD-001, OD-002)
  serial_num := cat || '-' || LPAD(next_num::text, 3, '0');
  
  RETURN serial_num;
END;
$$;

-- Grant necessary permissions
-- GRANT ALL ON serial_numbers_counter TO service_role;
-- GRANT EXECUTE ON FUNCTION get_next_serial_number TO service_role;

COMMENT ON TABLE serial_numbers_counter IS 'Tracks the current counter for each serial number category to ensure uniqueness';
COMMENT ON FUNCTION get_next_serial_number IS 'Atomically generates the next unique serial number for a given category';

