-- Drop existing message policies
DROP POLICY IF EXISTS "Members can see group messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their group" ON messages;

-- Create new policies for messages
CREATE POLICY "Users can see messages from their current group"
ON messages FOR SELECT
TO authenticated
USING (
  group_id = (SELECT current_group_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can send messages to their current group"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  group_id = (SELECT current_group_id FROM users WHERE id = auth.uid())
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id); 