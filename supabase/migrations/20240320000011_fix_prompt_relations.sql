-- Add back group_id column temporarily to allow for data migration
ALTER TABLE prompts
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_group_id ON prompts(group_id);

-- Add comment
COMMENT ON COLUMN prompts.group_id IS 'The group this prompt belongs to (temporary column for migration)'; 