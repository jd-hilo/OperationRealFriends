-- Add match_reason column to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS match_reason TEXT; 