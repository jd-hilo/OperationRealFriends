-- Create group_members table
CREATE TABLE group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Add foreign key relationships
ALTER TABLE group_members
ADD CONSTRAINT fk_group_members_group
FOREIGN KEY (group_id)
REFERENCES groups(id)
ON DELETE CASCADE;

ALTER TABLE group_members
ADD CONSTRAINT fk_group_members_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- Add RLS policies
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own group memberships"
ON group_members FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view members of their groups"
ON group_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can be added to groups"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
ON group_members FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 