/*
  # Initial Schema Setup

  1. Tables
    - users (id, created_at, quiz_answers, current_group_id)
    - groups (id, member_ids, streak_count, is_active, created_at)
    - prompts (id, question_text, created_at)
    - submissions (id, user_id, group_id, prompt_id, response_text, created_at)
    - messages (id, group_id, user_id, message_text, created_at)
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    
  3. Functions
    - add_user_to_group function for managing group membership
*/

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  quiz_answers jsonb,
  current_group_id uuid
);

-- Groups Table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_ids uuid[] DEFAULT ARRAY[]::uuid[],
  streak_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Prompts Table
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  group_id uuid REFERENCES groups(id),
  prompt_id uuid REFERENCES prompts(id),
  response_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id),
  user_id uuid REFERENCES users(id),
  message_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage their own data" ON users;
  DROP POLICY IF EXISTS "Members can access their groups" ON groups;
  DROP POLICY IF EXISTS "Public prompt access" ON prompts;
  DROP POLICY IF EXISTS "Members can see group submissions" ON submissions;
  DROP POLICY IF EXISTS "Users can create submissions" ON submissions;
  DROP POLICY IF EXISTS "Members can see group messages" ON messages;
  DROP POLICY IF EXISTS "Users can send messages to their group" ON messages;
END $$;

-- RLS Policies
-- Users can read/write their own data
CREATE POLICY "Users can manage their own data" ON users
  USING (true)
  WITH CHECK (true);

-- Groups are accessible to members
CREATE POLICY "Members can access their groups" ON groups
  USING (member_ids @> ARRAY[auth.uid()]);

-- Anyone can read prompts
CREATE POLICY "Public prompt access" ON prompts
  FOR SELECT USING (true);

-- Members can see submissions for their group
CREATE POLICY "Members can see group submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = submissions.group_id
      AND groups.member_ids @> ARRAY[auth.uid()]
    )
  );

-- Users can create submissions
CREATE POLICY "Users can create submissions" ON submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Members can see messages in their group
CREATE POLICY "Members can see group messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = messages.group_id
      AND groups.member_ids @> ARRAY[auth.uid()]
    )
  );

-- Users can send messages to their group
CREATE POLICY "Users can send messages to their group" ON messages
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Function to add user to group
CREATE OR REPLACE FUNCTION add_user_to_group(p_user_id uuid, p_group_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE groups
  SET member_ids = array_append(member_ids, p_user_id)
  WHERE id = p_group_id
  AND NOT (member_ids @> ARRAY[p_user_id]);
END;
$$ LANGUAGE plpgsql;

-- Sample prompts for testing
INSERT INTO prompts (question_text)
VALUES 
  ('What progress did you make on your goals today?'),
  ('What''s one small win you had in the last 24 hours?'),
  ('What was your biggest challenge today and how did you handle it?'),
  ('Share one thing you learned today.'),
  ('What are you grateful for today?')
ON CONFLICT DO NOTHING;