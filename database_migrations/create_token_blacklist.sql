-- Create token blacklist table to invalidate JWT tokens
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_jti VARCHAR(255) UNIQUE NOT NULL, -- JWT ID (jti claim)
    user_id UUID NOT NULL,
    blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(255) DEFAULT 'manual_logout',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Add RLS (Row Level Security) - only admins can access
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;

-- Policy: Only admin users can view and manage blacklist
CREATE POLICY "Admin users can manage token blacklist" ON token_blacklist
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid() 
            AND admin_users.role = 'admin'
        )
    );

-- Function to clean up expired tokens (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_blacklisted_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM token_blacklist 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE token_blacklist IS 'Stores blacklisted JWT tokens to force logout users';
COMMENT ON COLUMN token_blacklist.token_jti IS 'JWT ID (jti claim) from the token';
COMMENT ON COLUMN token_blacklist.reason IS 'Reason for blacklisting (manual_logout, password_change, etc.)';
