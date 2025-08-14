-- Fix the duplicate index issue by dropping the constraint instead of the index
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_username;

-- Now we can drop the duplicate index if it still exists
DROP INDEX IF EXISTS unique_username;