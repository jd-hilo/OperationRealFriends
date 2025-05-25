-- Add new user fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS preferred_language text,
ADD COLUMN IF NOT EXISTS preferred_name text;
 
-- Add comments to explain the columns
COMMENT ON COLUMN users.location IS 'User''s location';
COMMENT ON COLUMN users.preferred_language IS 'User''s preferred language';
COMMENT ON COLUMN users.preferred_name IS 'User''s preferred name'; 