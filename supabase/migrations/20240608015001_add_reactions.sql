-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);

-- Add RLS policies
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions for messages in their groups"
    ON reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN groups g ON m.group_id = g.id
            JOIN users u ON u.current_group_id = g.id
            WHERE m.id = reactions.message_id
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "Users can add reactions to messages in their groups"
    ON reactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN groups g ON m.group_id = g.id
            JOIN users u ON u.current_group_id = g.id
            WHERE m.id = reactions.message_id
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "Users can remove their own reactions"
    ON reactions FOR DELETE
    USING (user_id = auth.uid()); 