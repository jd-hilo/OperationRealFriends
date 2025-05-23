-- Add prompt-related columns to groups table
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS current_prompt TEXT,
ADD COLUMN IF NOT EXISTS prompt_submitted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prompt_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS prompt_due_at TIMESTAMP WITH TIME ZONE;

-- Add index for prompt status
CREATE INDEX IF NOT EXISTS idx_groups_prompt_status ON groups(prompt_submitted); 