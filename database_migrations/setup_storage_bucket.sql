-- Create storage bucket for payment proofs
-- This migration sets up the required storage bucket and policies

-- Create the payment-proofs bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
);

-- Drop existing policies first (in case they exist)
DROP POLICY IF EXISTS "Public can view payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage payment proofs" ON storage.objects;

-- Create policy for public read access to payment proofs
CREATE POLICY "Public can view payment proofs" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-proofs');

-- Create policy for authenticated users to upload payment proofs
CREATE POLICY "Authenticated users can upload payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.role() = 'authenticated'
);

-- Create policy for service role to manage all payment proofs
CREATE POLICY "Service role can manage payment proofs" ON storage.objects
FOR ALL USING (bucket_id = 'payment-proofs' AND auth.role() = 'service_role');

-- Alternative: More permissive policy for service role (uncomment if needed)
-- CREATE POLICY "Service role can do everything" ON storage.objects
-- FOR ALL USING (auth.role() = 'service_role');

-- Verify bucket creation
SELECT * FROM storage.buckets WHERE id = 'payment-proofs';
