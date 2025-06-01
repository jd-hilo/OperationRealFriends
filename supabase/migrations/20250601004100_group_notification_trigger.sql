-- Create a function to handle group ID changes
CREATE OR REPLACE FUNCTION handle_group_id_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the group ID has changed
  IF OLD.current_group_id IS DISTINCT FROM NEW.current_group_id THEN
    -- Make HTTP request to the Edge Function
    PERFORM
      http.post(
        CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/notify-group-assignment'),
        jsonb_build_object(
          'user_id', NEW.id,
          'new_group_id', NEW.current_group_id
        )::text,
        'application/json',
        ARRAY[
          http_header('Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key')))
        ]
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