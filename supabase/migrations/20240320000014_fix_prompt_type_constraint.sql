-- Drop the old type check constraint if it exists
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_type_check;

-- Ensure we have the correct prompt_type constraint
ALTER TABLE prompts 
  DROP CONSTRAINT IF EXISTS prompt_type_check,
  ADD CONSTRAINT prompt_type_check 
    CHECK (prompt_type IN ('text', 'audio', 'photo'));

-- Update any existing 'picture' values to 'photo'
UPDATE prompts 
SET prompt_type = 'photo' 
WHERE prompt_type = 'picture';

-- Add comment
COMMENT ON COLUMN prompts.prompt_type IS 'The type of response expected (text, audio, or photo)'; 