-- Add due_date column to prompts table
ALTER TABLE prompts
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours');

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_due_date ON prompts(due_date);

-- Add comment
COMMENT ON COLUMN prompts.due_date IS 'When this prompt is due'; 