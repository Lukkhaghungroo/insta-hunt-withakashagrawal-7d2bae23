import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { query, limit = 20, filters = {} } = await req.json();

    if (!query) {
      throw new Error('Search query is required');
    }

    // Generate embedding for the search query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-3-small',
        dimensions: 384,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI API error: ${embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Perform vector similarity search
    let rpcQuery = supabase.rpc('match_profiles', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
    });

    // Apply additional filters
    if (filters.category) {
      rpcQuery = rpcQuery.filter('category', 'ilike', `%${filters.category}%`);
    }
    if (filters.city) {
      rpcQuery = rpcQuery.filter('city', 'ilike', `%${filters.city}%`);
    }
    if (filters.minFollowers) {
      rpcQuery = rpcQuery.filter('followers', 'gte', filters.minFollowers);
    }
    if (filters.maxFollowers) {
      rpcQuery = rpcQuery.filter('followers', 'lte', filters.maxFollowers);
    }

    const { data: matches, error } = await rpcQuery;

    if (error) {
      // Fallback to text search if vector search fails
      console.warn('Vector search failed, falling back to text search:', error);
      
      let fallbackQuery = supabase
        .from('profiles')
        .select('*')
        .or(`brand_name.ilike.%${query}%,bio.ilike.%${query}%,category.ilike.%${query}%`);

      if (filters.category) {
        fallbackQuery = fallbackQuery.ilike('category', `%${filters.category}%`);
      }
      if (filters.city) {
        fallbackQuery = fallbackQuery.ilike('city', `%${filters.city}%`);
      }
      if (filters.minFollowers) {
        fallbackQuery = fallbackQuery.gte('followers', filters.minFollowers);
      }
      if (filters.maxFollowers) {
        fallbackQuery = fallbackQuery.lte('followers', filters.maxFollowers);
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery
        .order('followers', { ascending: false })
        .limit(limit);

      if (fallbackError) throw fallbackError;

      return new Response(JSON.stringify({
        results: fallbackData?.map(profile => ({
          ...profile,
          similarity: 0.5 // Default similarity for text search
        })) || [],
        searchType: 'text',
        query
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      results: matches || [],
      searchType: 'vector',
      query
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in smart-search function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to perform smart search'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});