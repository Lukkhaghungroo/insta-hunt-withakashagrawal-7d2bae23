-- Create the profiles table with vector extension enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create scraping_sessions table
CREATE TABLE public.scraping_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  total_profiles INTEGER NOT NULL DEFAULT 0,
  confirmed_profiles INTEGER NOT NULL DEFAULT 0,
  unconfirmed_profiles INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table with vector embeddings
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.scraping_sessions(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  url TEXT NOT NULL,
  brand_name TEXT,
  followers INTEGER,
  bio TEXT,
  category TEXT,
  city TEXT,
  confidence TEXT,
  bio_embedding vector(768), -- Gemini embeddings are 768-dimensional
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(username)
);

-- Enable Row Level Security
ALTER TABLE public.scraping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth is implemented)
CREATE POLICY "Allow all operations on scraping_sessions" 
ON public.scraping_sessions 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on profiles" 
ON public.profiles 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_scraping_sessions_updated_at
BEFORE UPDATE ON public.scraping_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for vector similarity search
CREATE INDEX profiles_bio_embedding_idx ON public.profiles 
USING hnsw (bio_embedding vector_cosine_ops);