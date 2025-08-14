-- Clean up invalid and test data from profiles table
-- Remove profiles with obviously fake/generated names and invalid URLs

DELETE FROM public.profiles 
WHERE 
  -- Remove profiles with generated names like "Profile 1754672514257"
  brand_name ILIKE 'Profile %' 
  OR username ILIKE 'profile_%'
  -- Remove profiles with invalid Instagram URLs (reels/posts instead of profiles)
  OR url ILIKE '%/reel/%' 
  OR url ILIKE '%/p/%'
  OR url ILIKE '%/stories/%'
  -- Remove profiles with no followers data
  OR followers = 0
  OR followers IS NULL;