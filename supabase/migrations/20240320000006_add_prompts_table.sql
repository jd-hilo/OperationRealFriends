-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS prompts_group_id_idx ON prompts(group_id);
CREATE INDEX IF NOT EXISTS prompts_due_date_idx ON prompts(due_date);

-- Add prompt-related columns to groups table
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS current_prompt_id UUID REFERENCES prompts(id),
ADD COLUMN IF NOT EXISTS next_prompt_due TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON TABLE prompts IS 'Stores daily prompts for groups';
COMMENT ON COLUMN prompts.content IS 'The prompt text';
COMMENT ON COLUMN prompts.group_id IS 'The group this prompt belongs to';
COMMENT ON COLUMN prompts.due_date IS 'When this prompt is due';
COMMENT ON COLUMN groups.current_prompt_id IS 'The current active prompt for this group';
COMMENT ON COLUMN groups.next_prompt_due IS 'When the next prompt should be generated'; 