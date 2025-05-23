-- Add a 'type' column to the prompts table
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('text', 'audio', 'picture'));

-- Create a junction table for prompts and groups
CREATE TABLE IF NOT EXISTS group_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, prompt_id)
);

-- Enable RLS on group_prompts
ALTER TABLE group_prompts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view group_prompts
CREATE POLICY "Authenticated users can view group_prompts"
ON group_prompts FOR SELECT
TO authenticated
USING (true); 