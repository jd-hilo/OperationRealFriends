-- Remove the 'current_prompt' column from the groups table
ALTER TABLE groups DROP COLUMN IF EXISTS current_prompt; 