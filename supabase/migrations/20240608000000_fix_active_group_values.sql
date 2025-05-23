-- Migration to clean up invalid active_group values in users table
UPDATE users SET active_group = NULL WHERE active_group IS NULL OR active_group = '' OR active_group = 'true' OR active_group = 'false' OR active_group IS TRUE OR active_group IS FALSE;

-- Convert valid UUID strings to UUID type
UPDATE users 
SET active_group = active_group::uuid 
WHERE active_group IS NOT NULL 
AND active_group ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'; 