
-- Phase 1: Database Foundation
-- Create profiles table to store Instagram lead data permanently
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  followers INTEGER DEFAULT 0,
  bio TEXT,
  category TEXT,
  city TEXT,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  bio_embedding vector(384), -- For AI embeddings in Phase 2
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster searches
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_category_city ON public.profiles(category, city);
CREATE INDEX idx_profiles_followers ON public.profiles(followers DESC);

-- Create scraping sessions table to track data import history
CREATE TABLE public.scraping_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  total_profiles INTEGER DEFAULT 0,
  confirmed_profiles INTEGER DEFAULT 0,
  unconfirmed_profiles INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (we'll make this public for now since no auth is implemented)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access for now
CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on sessions" ON public.scraping_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on sessions" ON public.scraping_sessions FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
