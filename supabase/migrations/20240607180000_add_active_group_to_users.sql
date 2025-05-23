-- Add active_group column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_group uuid DEFAULT null; 