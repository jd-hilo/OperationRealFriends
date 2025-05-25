-- Drop the 'type' column if it exists (since we're using prompt_type)
ALTER TABLE prompts DROP COLUMN IF EXISTS type;

-- Ensure prompt_type column exists with correct values
ALTER TABLE prompts 
  ALTER COLUMN prompt_type SET NOT NULL,
  ALTER COLUMN prompt_type SET DEFAULT 'text',
  ADD CONSTRAINT prompt_type_check 
    CHECK (prompt_type IN ('text', 'audio', 'photo'));

-- Update any existing 'picture' values to 'photo'
UPDATE prompts 
SET prompt_type = 'photo' 
WHERE prompt_type = 'picture';

-- Add comment
COMMENT ON COLUMN prompts.prompt_type IS 'The type of response expected (text, audio, or photo)'; 