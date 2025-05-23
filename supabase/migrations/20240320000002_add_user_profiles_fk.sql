-- Add foreign key from user_profiles.user_id to users.id
ALTER TABLE user_profiles
ADD CONSTRAINT fk_user_profiles_user
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE; 