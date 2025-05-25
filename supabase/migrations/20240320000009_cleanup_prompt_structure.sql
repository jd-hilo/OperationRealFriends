-- Remove redundant group_id column from prompts table
ALTER TABLE prompts DROP COLUMN IF EXISTS group_id;

-- Ensure group_prompts table has all necessary columns and constraints
ALTER TABLE group_prompts
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_prompts_group_id ON group_prompts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_prompts_prompt_id ON group_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS idx_group_prompts_due_date ON group_prompts(due_date);

-- Add comments
COMMENT ON TABLE group_prompts IS 'Junction table linking groups to their prompts';
COMMENT ON COLUMN group_prompts.due_date IS 'When this prompt is due for the group';
COMMENT ON COLUMN group_prompts.is_active IS 'Whether this prompt is currently active for the group';

-- Update RLS policies for group_prompts
DROP POLICY IF EXISTS "Authenticated users can view group_prompts" ON group_prompts;

CREATE POLICY "Users can view prompts for their groups"
ON group_prompts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = group_prompts.group_id
    AND groups.member_ids @> ARRAY[auth.uid()]
  )
);

-- Add function to get current prompt for a group
CREATE OR REPLACE FUNCTION get_current_group_prompt(p_group_id UUID)
RETURNS UUID AS $$
DECLARE
  v_prompt_id UUID;
BEGIN
  SELECT prompt_id INTO v_prompt_id
  FROM group_prompts
  WHERE group_id = p_group_id
  AND is_active = true
  AND due_date > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN v_prompt_id;
END;
$$ LANGUAGE plpgsql; 