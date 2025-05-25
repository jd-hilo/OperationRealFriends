-- Add prompt_type column to prompts table
ALTER TABLE prompts
ADD COLUMN IF NOT EXISTS prompt_type TEXT NOT NULL DEFAULT 'text' CHECK (prompt_type IN ('text', 'audio', 'photo'));
 
-- Add comment
COMMENT ON COLUMN prompts.prompt_type IS 'The type of response expected (text, audio, or photo)'; 