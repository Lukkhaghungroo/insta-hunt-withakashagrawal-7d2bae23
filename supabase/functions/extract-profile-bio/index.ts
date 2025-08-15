import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

// Standard CORS headers for Supabase functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Interfaces ---
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

// --- Helper Functions ---

/**
 * Creates a Supabase client from the request's Authorization header
 * and verifies the user's JWT to ensure they are authenticated.
 * @param {Request} req - The incoming request object.
 * @returns {Promise<any>} The authenticated user object.
 * @throws {Error} If the user is not authenticated or the token is invalid.
 */
async function getSupabaseUser(req: Request): Promise<any> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error) {
    throw new Error(`Authentication error: ${error.message}`);
  }
  if (!user) {
    throw new Error('User not found or token is invalid');
  }
  return user;
}

/**
 * Validates if the provided URL is a valid Instagram profile URL.
 * @param {string} url - The URL to validate.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
function isValidInstagramProfileUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('instagram.com')) return false;
    
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length !== 1 || ['p', 'reel', 'stories', 'explore', 'accounts'].includes(pathParts[0].toLowerCase())) {
      return false;
    }
    
    return /^[a-zA-Z0-9._]{1,30}$/.test(pathParts[0]);
  } catch {
    return false;
  }
}

/**
 * Extracts the username from an Instagram URL.
 * @param {string} url - The Instagram URL.
 * @returns {string} The extracted username.
 */
function extractUsernameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    return pathParts[0] || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Mock function to simulate AI-based profile data extraction.
 * @param {string} url - The profile URL.
 * @returns {Promise<ExtractedProfileData>} The extracted profile data.
 */
async function extractProfileWithAI(url: string): Promise<ExtractedProfileData> {
  // NOTE: This is a mock implementation. In a real-world scenario, you would
  // integrate a web scraping service or a browser automation tool here.
  const username = extractUsernameFromUrl(url);
  
  return {
    bio: `This is a sample bio for ${username}. It would contain details about the user's interests and profession.`,
    brandName: username.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    username,
    followers: Math.floor(Math.random() * 100000) + 1000, // Mock follower count
    isValidProfile: isValidInstagramProfileUrl(url),
    confidence: isValidInstagramProfileUrl(url) ? 'high' : 'low'
  };
}


// --- Main Function Handler ---
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // **SECURITY: Authenticate the user before any other operation**
    await getSupabaseUser(req);

    const { url }: ProfileExtractionRequest = await req.json();
    
    if (!url) {
      throw new Error('URL parameter is required');
    }

    if (!isValidInstagramProfileUrl(url)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid Instagram profile URL. Must be a direct profile URL like https://instagram.com/username',
        isValidProfile: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Request received for URL: ${url}`);
    
    // Perform the profile data extraction
    const profileData = await extractProfileWithAI(url);
    
    console.log(`Successfully extracted data for ${url}:`, profileData);
    
    return new Response(JSON.stringify(profileData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-profile-bio function:', error.message);
    const isAuthError = error.message.includes('Authentication') || error.message.includes('Authorization');
    
    return new Response(JSON.stringify({ 
      error: error.message,
    }), {
      status: isAuthError ? 401 : 500, // Return 401 for auth errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
