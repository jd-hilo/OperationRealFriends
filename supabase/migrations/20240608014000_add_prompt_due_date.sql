-- Add prompt_due_date column to groups table
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS prompt_due_date TIMESTAMP WITH TIME ZONE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_groups_prompt_due_date ON groups(prompt_due_date);

-- Add comment
COMMENT ON COLUMN groups.prompt_due_date IS 'When the current prompt is due for submission'; 