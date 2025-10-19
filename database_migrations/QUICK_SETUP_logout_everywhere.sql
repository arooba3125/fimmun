-- Quick setup for logout everywhere functionality
-- Run this in your Supabase SQL editor

-- 1. Create token blacklist table
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(255) DEFAULT 'manual_logout',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- 3. Enable RLS
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;

-- 4. Create policy (adjust based on your auth setup)
-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Admin users can manage token blacklist" ON token_blacklist;
CREATE POLICY "Admin users can manage token blacklist" ON token_blacklist
    FOR ALL USING (true); -- Temporarily allow all, adjust as needed

-- 5. Add cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_blacklisted_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM token_blacklist 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Token blacklist table created successfully! You can now use the logout everywhere feature.' as message;
