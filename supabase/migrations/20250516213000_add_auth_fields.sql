-- Add authentication and queue-related fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email text UNIQUE,
ADD COLUMN IF NOT EXISTS has_completed_quiz boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_in_queue boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS queue_position integer,
ADD COLUMN IF NOT EXISTS last_activity timestamp with time zone DEFAULT now();

-- Create queue table
CREATE TABLE IF NOT EXISTS queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  position integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on queue table
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;

-- Queue policies
CREATE POLICY "Users can see their own queue position" ON queue
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join queue" ON queue
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave queue" ON queue
  FOR DELETE USING (user_id = auth.uid());

-- Function to get queue position
CREATE OR REPLACE FUNCTION get_queue_position(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_position integer;
BEGIN
  SELECT position INTO v_position
  FROM queue
  WHERE user_id = p_user_id;
  
  RETURN v_position;
END;
$$ LANGUAGE plpgsql;

-- Function to join queue
CREATE OR REPLACE FUNCTION join_queue(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_position integer;
BEGIN
  -- Get the next position
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
  FROM queue;
  
  -- Insert user into queue
  INSERT INTO queue (user_id, position)
  VALUES (p_user_id, v_position);
  
  -- Update user's queue status
  UPDATE users
  SET is_in_queue = true,
      queue_position = v_position
  WHERE id = p_user_id;
  
  RETURN v_position;
END;
$$ LANGUAGE plpgsql;

-- Function to leave queue
CREATE OR REPLACE FUNCTION leave_queue(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Remove user from queue
  DELETE FROM queue
  WHERE user_id = p_user_id;
  
  -- Update user's queue status
  UPDATE users
  SET is_in_queue = false,
      queue_position = NULL
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql; 