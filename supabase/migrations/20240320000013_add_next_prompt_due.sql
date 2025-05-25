-- Add next_prompt_due column to groups table
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS next_prompt_due TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_groups_next_prompt_due ON groups(next_prompt_due);

-- Add comment
COMMENT ON COLUMN groups.next_prompt_due IS 'When the next prompt should be generated'; 