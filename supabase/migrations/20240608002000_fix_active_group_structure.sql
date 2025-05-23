-- Drop the existing active_group column
ALTER TABLE users DROP COLUMN IF EXISTS active_group;

-- Add current_group_id column (UUID)
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_group_id uuid DEFAULT null;

-- Add active_group boolean column
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_group boolean DEFAULT false;

-- Add foreign key constraint for current_group_id
ALTER TABLE users
ADD CONSTRAINT fk_users_current_group
FOREIGN KEY (current_group_id)
REFERENCES groups(id)
ON DELETE SET NULL; 