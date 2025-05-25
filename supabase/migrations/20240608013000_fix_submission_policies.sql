-- Drop existing submission policies
DROP POLICY IF EXISTS "Members can see group submissions" ON submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON submissions;

-- Create new policies for submissions
CREATE POLICY "Users can see submissions from their current group"
ON submissions FOR SELECT
TO authenticated
USING (
  group_id = (SELECT current_group_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can create submissions in their current group"
ON submissions FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  group_id = (SELECT current_group_id FROM users WHERE id = auth.uid())
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_group_id ON submissions(group_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_prompt_id ON submissions(prompt_id);

-- Update group_prompts policies
DROP POLICY IF EXISTS "Authenticated users can view group_prompts" ON group_prompts;
DROP POLICY IF EXISTS "Users can view prompts for their groups" ON group_prompts;

CREATE POLICY "Users can view prompts for their current group"
ON group_prompts FOR SELECT
TO authenticated
USING (
  group_id = (SELECT current_group_id FROM users WHERE id = auth.uid())
);

-- Update prompts policies
DROP POLICY IF EXISTS "Public prompt access" ON prompts;
DROP POLICY IF EXISTS "Anyone can read prompts" ON prompts;

CREATE POLICY "Users can view prompts"
ON prompts FOR SELECT
TO authenticated
USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_prompts_group_id ON group_prompts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_prompts_prompt_id ON group_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS idx_group_prompts_due_date ON group_prompts(due_date);

-- Add comments
COMMENT ON TABLE submissions IS 'Stores user responses to prompts';
COMMENT ON TABLE group_prompts IS 'Junction table linking groups to their prompts';
COMMENT ON TABLE prompts IS 'Stores daily prompts for groups'; 