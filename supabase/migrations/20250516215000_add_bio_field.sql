-- Add bio and avatar_url fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Update RLS policies if needed (bio and avatar_url should be readable by group members)
-- The existing policies should already cover these fields 