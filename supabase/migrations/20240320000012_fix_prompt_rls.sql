-- Drop existing prompt policies
DROP POLICY IF EXISTS "Public prompt access" ON prompts;

-- Create new policies for prompts
CREATE POLICY "Anyone can read prompts"
ON prompts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create prompts"
ON prompts FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE prompts IS 'Stores daily prompts for groups'; 