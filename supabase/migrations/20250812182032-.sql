-- SECURITY HARDENING MIGRATION
-- 1) Ensure RLS is enabled
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scraping_sessions ENABLE ROW LEVEL SECURITY;

-- 2) Drop overly-permissive policies if present
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations on scraping_sessions" ON public.scraping_sessions;

-- 3) Recreate safe policies
-- Profiles: authenticated users may read only searchable rows
DROP POLICY IF EXISTS "Allow filtered profile search" ON public.profiles;
CREATE POLICY "Allow filtered profile search"
ON public.profiles
FOR SELECT
USING (
  auth.role() = 'authenticated' AND is_searchable = true
);

-- Profiles: only service_role can write (insert/update/delete)
DROP POLICY IF EXISTS "Service role write profiles" ON public.profiles;
CREATE POLICY "Service role write profiles"
ON public.profiles
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Scraping sessions: only service_role can read and write
DROP POLICY IF EXISTS "Allow service role read scraping_sessions" ON public.scraping_sessions;
CREATE POLICY "Allow service role read scraping_sessions"
ON public.scraping_sessions
FOR SELECT
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role write scraping_sessions" ON public.scraping_sessions;
CREATE POLICY "Service role write scraping_sessions"
ON public.scraping_sessions
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 4) Harden SECURITY DEFINER functions' search_path
-- match_profiles(query_embedding extensions.vector, match_threshold double precision, match_count integer)
ALTER FUNCTION public.match_profiles(extensions.vector, double precision, integer)
  SET search_path TO 'public','extensions';

-- update_updated_at_column()
ALTER FUNCTION public.update_updated_at_column()
  SET search_path TO 'public','extensions';