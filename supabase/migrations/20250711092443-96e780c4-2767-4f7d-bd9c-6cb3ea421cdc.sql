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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_bio_embedding ON profiles USING ivfflat (bio_embedding vector_cosine_ops) WITH (lists = 100);

-- Add trigger to automatically call analyze-bio function when new profiles are inserted
CREATE OR REPLACE FUNCTION trigger_analyze_bio()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if bio exists and no embedding yet
  IF NEW.bio IS NOT NULL AND NEW.bio != '' AND NEW.bio_embedding IS NULL THEN
    PERFORM
      net.http_post(
        url := 'https://vpyxyyogujddyhqgapkv.supabase.co/functions/v1/analyze-bio',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweXh5eW9ndWpkZHlocWdhcGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjY1MDAsImV4cCI6MjA2NzE0MjUwMH0.ESldrrW05CiRdRyWrablbCs2yM_MeIjDDF6MZ96zZ48"}'::jsonb,
        body := jsonb_build_object(
          'type', 'INSERT',
          'table', 'profiles',
          'record', to_jsonb(NEW),
          'schema', 'public'
        )
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_profile_bio_insert'
  ) THEN
    CREATE TRIGGER on_profile_bio_insert
      AFTER INSERT ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION trigger_analyze_bio();
  END IF;
END
$$;