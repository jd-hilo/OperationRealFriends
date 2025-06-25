-- Add personality type fields to users table
ALTER TABLE users
ADD COLUMN personality_type text,
ADD COLUMN personality_description text,
ADD COLUMN personalitydepth text,
ADD COLUMN personalitymatch text; 