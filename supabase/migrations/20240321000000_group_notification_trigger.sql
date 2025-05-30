-- Create a function to handle group ID changes
CREATE OR REPLACE FUNCTION handle_group_id_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when current_group_id changes from null to a value
  IF OLD.current_group_id IS NULL AND NEW.current_group_id IS NOT NULL THEN
    -- Call the edge function
    PERFORM
      net.http_post(
        url := CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/notify-group-assignment'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key'))
        ),
        body := jsonb_build_object(
          'user_id', NEW.id,
          'new_group_id', NEW.current_group_id
        )
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_group_id_change ON users;
CREATE TRIGGER on_group_id_change
  AFTER UPDATE OF current_group_id ON users
  FOR EACH ROW
  EXECUTE FUNCTION handle_group_id_change(); 