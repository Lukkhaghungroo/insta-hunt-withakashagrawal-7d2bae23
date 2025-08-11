-- Ensure a dedicated schema for extensions exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the vector extension out of public if it exists there
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'vector' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION vector SET SCHEMA extensions;
  END IF;
END$$;

-- Recreate update_updated_at_column with fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate match_profiles with fixed search_path (uses vector operators)
CREATE OR REPLACE FUNCTION public.match_profiles(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  username text,
  url text,
  brand_name text,
  followers integer,
  bio text,
  category text,
  city text,
  confidence text,
  created_at timestamptz,
  updated_at timestamptz,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
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
  ORDER BY profiles.bio_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;