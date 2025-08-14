-- Fix RLS policies for optimal performance by preventing per-row evaluation
-- and consolidating overlapping policies

-- Drop existing policies that have performance issues
DROP POLICY IF EXISTS "Allow service role read scraping_sessions" ON public.scraping_sessions;
DROP POLICY IF EXISTS "Service role write scraping_sessions" ON public.scraping_sessions;
DROP POLICY IF EXISTS "Authenticated can read searchable profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can write profiles" ON public.profiles;

-- Add missing is_searchable column with proper default
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_searchable boolean DEFAULT true;

-- Create optimized RLS policies with SELECT statements to prevent per-row evaluation

-- Scraping sessions policies - optimized for performance
CREATE POLICY "Service role can manage scraping_sessions" 
ON public.scraping_sessions 
FOR ALL 
USING ((SELECT auth.role()) = 'service_role') 
WITH CHECK ((SELECT auth.role()) = 'service_role');

-- Profiles policies - optimized and consolidated
CREATE POLICY "Service role can manage profiles" 
ON public.profiles 
FOR ALL 
USING ((SELECT auth.role()) = 'service_role') 
WITH CHECK ((SELECT auth.role()) = 'service_role');

CREATE POLICY "Authenticated users can read searchable profiles" 
ON public.profiles 
FOR SELECT 
USING (
  ((SELECT auth.role()) = 'authenticated' AND is_searchable = true) OR 
  ((SELECT auth.role()) = 'anon' AND is_searchable = true)
);

-- Performance optimizations: Add missing indexes and remove duplicates

-- Add index for session_id foreign key to improve join performance
CREATE INDEX IF NOT EXISTS idx_profiles_session_id ON public.profiles(session_id);

-- Drop duplicate index (keep the system-generated one)
DROP INDEX IF EXISTS unique_username;

-- Remove unused bio embedding index if vector search isn't implemented
DROP INDEX IF EXISTS profiles_bio_embedding_idx;

-- Update the match_profiles function to use immutable search_path for security
CREATE OR REPLACE FUNCTION public.match_profiles(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 20)
RETURNS TABLE(id uuid, username text, url text, brand_name text, followers integer, bio text, category text, city text, confidence text, created_at timestamp with time zone, updated_at timestamp with time zone, similarity double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    profiles.id,
    profiles.username,
    profiles.url,
    profiles.brand_name,
    profiles.followers,
    profiles.bio,
    profiles.category,
    profiles.city,
    profiles.confidence,
    profiles.created_at,
    profiles.updated_at,
    1 - (profiles.bio_embedding <=> query_embedding) AS similarity
  FROM profiles
  WHERE profiles.bio_embedding IS NOT NULL
    AND 1 - (profiles.bio_embedding <=> query_embedding) > match_threshold
    AND profiles.is_searchable = true
  ORDER BY profiles.bio_embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;