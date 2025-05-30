-- Add last_streak_update column to groups table
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS last_streak_update TIMESTAMP WITH TIME ZONE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_groups_last_streak_update ON groups(last_streak_update);

-- Add comment
COMMENT ON COLUMN groups.last_streak_update IS 'When the group streak was last updated'; 