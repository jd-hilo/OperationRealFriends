-- Add push_token column to users table
ALTER TABLE users
ADD COLUMN push_token TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN users.push_token IS 'Expo push notification token for the user'; 