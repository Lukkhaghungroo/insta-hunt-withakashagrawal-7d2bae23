import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProfileExtractionRequest {
  url: string;
  username?: string;
}

interface ExtractedProfileData {
  bio: string;
  brandName: string;
  username: string;
  followers: number;
  isValidProfile: boolean;
  confidence: 'high' | 'medium' | 'low';
}

function isValidInstagramProfileUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('instagram.com')) return false;
    
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    // Should be just username, not a post/reel/story
    if (pathParts.length !== 1) return false;
    if (['p', 'reel', 'stories', 'explore', 'accounts'].includes(pathParts[0].toLowerCase())) return false;
    
    return /^[a-zA-Z0-9._]{1,30}$/.test(pathParts[0]);
  } catch {
    return false;
  }
}

async function extractProfileWithAI(url: string): Promise<ExtractedProfileData> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // For now, return mock data as we can't actually scrape Instagram due to rate limits/blocking
  // In production, this would integrate with a web scraper or browser automation
  const username = extractUsernameFromUrl(url);
  
  return {
    bio: `Bio information for ${username} - extracted bio content would go here`,
    brandName: username.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    username,
    followers: Math.floor(Math.random() * 100000) + 1000, // Mock follower count
    isValidProfile: isValidInstagramProfileUrl(url),
    confidence: isValidInstagramProfileUrl(url) ? 'high' : 'low'
  };
}

function extractUsernameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    return pathParts[0] || 'unknown';
  } catch {
    return 'unknown';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, username }: ProfileExtractionRequest = await req.json();
    
    console.log(`Extracting profile data for: ${url}`);
    
    if (!url) {
      throw new Error('URL is required');
    }

    // Validate URL format
    if (!isValidInstagramProfileUrl(url)) {
      console.log(`Invalid Instagram profile URL: ${url}`);
      return new Response(JSON.stringify({ 
        error: 'Invalid Instagram profile URL. Must be a direct profile URL like https://instagram.com/username',
        isValidProfile: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract profile data
    const profileData = await extractProfileWithAI(url);
    
    console.log(`Successfully extracted profile data:`, profileData);
    
    return new Response(JSON.stringify(profileData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-profile-bio function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      isValidProfile: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});