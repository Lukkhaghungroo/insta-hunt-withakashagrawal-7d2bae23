-- Enable leaked password protection
-- This migration will be executed through the Supabase dashboard manually

-- Note: The actual leaked password protection setting needs to be enabled
-- in the Supabase dashboard under Authentication > Settings > Security
-- This SQL is for documentation purposes only

-- Additional security hardening measures
ALTER TABLE auth.users 
  ADD CONSTRAINT check_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add a function to log authentication attempts
CREATE OR REPLACE FUNCTION public.log_auth_attempt(
  user_email text,
  success boolean,
  ip_address inet DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.auth_logs (email, success, ip_address, attempted_at)
  VALUES (user_email, success, ip_address, NOW())
  ON CONFLICT DO NOTHING;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, create it
    CREATE TABLE IF NOT EXISTS public.auth_logs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      email text NOT NULL,
      success boolean NOT NULL DEFAULT false,
      ip_address inet,
      attempted_at timestamp with time zone DEFAULT NOW()
    );
    
    -- Enable RLS on the new table
    ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;
    
    -- Create policy for service role access only
    CREATE POLICY "Service role can access auth logs"
      ON public.auth_logs
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
    
    -- Retry the insert
    INSERT INTO public.auth_logs (email, success, ip_address, attempted_at)
    VALUES (user_email, success, ip_address, NOW());
END;
$$;