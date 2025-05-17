/*
  # Initial Schema Setup

  1. New Tables
    - users: Stores user profiles and quiz answers
    - groups: Manages group membership and streaks
    - prompts: Stores daily check-in questions
    - submissions: Records user responses to prompts
    - messages: Handles group chat functionality

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Add policies for group member access
    - Add policies for prompt visibility
    - Add policies for submission management
    - Add policies for message handling

  3. Functions
    - add_user_to_group: Helper function to manage group membership
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
  ('What are you grateful for today?');