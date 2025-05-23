-- Add a 'current_prompt_id' column to the groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS current_prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL; 