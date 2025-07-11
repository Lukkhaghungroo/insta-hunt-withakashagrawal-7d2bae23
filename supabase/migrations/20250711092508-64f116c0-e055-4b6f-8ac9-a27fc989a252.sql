-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector search function for smart search  
CREATE OR REPLACE FUNCTION match_profiles(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 20
)
RETURNS TABLE (
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
  similarity float
)
LANGUAGE plpgsql
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