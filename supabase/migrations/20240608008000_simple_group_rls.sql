-- Remove old policies
DROP POLICY IF EXISTS "Members can access their groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can view groups" ON groups;
DROP POLICY IF EXISTS "Allow all authenticated users to access groups" ON groups;

-- Allow users to read a group if their id is in member_ids or their current_group_id matches the group id
CREATE POLICY "User can view their group"
ON groups FOR SELECT
TO authenticated
USING (
  (member_ids @> ARRAY[auth.uid()]) OR
  (id = (SELECT current_group_id FROM users WHERE id = auth.uid()))
); 