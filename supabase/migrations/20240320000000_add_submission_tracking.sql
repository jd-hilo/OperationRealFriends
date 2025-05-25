-- Add submission tracking columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_submission_date TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on last_submission_date
CREATE INDEX IF NOT EXISTS idx_users_last_submission_date ON users(last_submission_date);

-- Add comment to explain the columns
COMMENT ON COLUMN users.submitted IS 'Indicates if the user has submitted their response for the current day';
COMMENT ON COLUMN users.last_submission_date IS 'Timestamp of the user''s last submission, used to reset submission status at midnight';

-- Create a function to reset submission status at midnight
CREATE OR REPLACE FUNCTION reset_submission_status()
RETURNS void AS $$
BEGIN
    UPDATE users
    SET submitted = false
    WHERE last_submission_date < date_trunc('day', now());
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically reset submission status at midnight
CREATE OR REPLACE FUNCTION trigger_reset_submission_status()
RETURNS trigger AS $$
BEGIN
    IF date_trunc('day', NEW.last_submission_date) > date_trunc('day', OLD.last_submission_date) THEN
        PERFORM reset_submission_status();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_submission_status_trigger
    AFTER UPDATE OF last_submission_date ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_reset_submission_status(); 