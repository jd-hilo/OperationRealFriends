-- Drop the old recursive policy
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;

-- Add a new, non-recursive policy
CREATE POLICY "Users can view members of their groups"
ON group_members FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
); 