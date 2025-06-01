-- Enable the http extension
CREATE EXTENSION IF NOT EXISTS http;

-- Grant usage to authenticated and anon roles
GRANT USAGE ON SCHEMA http TO authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA http TO authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA http TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA http TO service_role; 