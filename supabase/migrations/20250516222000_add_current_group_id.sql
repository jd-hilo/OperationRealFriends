-- Add current_group_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS current_group_id UUID REFERENCES public.groups(id); 