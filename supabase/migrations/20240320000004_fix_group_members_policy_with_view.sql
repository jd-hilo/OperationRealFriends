-- Create a view for the current user's group IDs
CREATE OR REPLACE VIEW my_group_ids AS
SELECT group_id FROM group_members WHERE user_id = auth.uid();

-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;

-- Add a new policy referencing the view
CREATE POLICY "Users can view members of their groups"
ON group_members FOR SELECT
TO authenticated
USING (
  group_id IN (SELECT group_id FROM my_group_ids)
); 