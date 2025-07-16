import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE';
  table: string;
  record: any;
  schema: string;
  old_record?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WebhookPayload = await req.json();
    
    // Only process new profile insertions that need bio analysis
    if (payload.type !== 'INSERT' || payload.table !== 'profiles') {
      return new Response(JSON.stringify({ message: 'Not a profile insertion' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const profile = payload.record;
    
    // Skip if bio is empty or embedding already exists
    if (!profile.bio || profile.bio_embedding) {
      return new Response(JSON.stringify({ message: 'No bio to analyze or embedding exists' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate embedding using Gemini
    const embeddingResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ text: profile.bio }]
        },
        outputDimensionality: 384,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`Gemini API error: ${embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.embedding.values;

    // Update profile with embedding
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ bio_embedding: embedding })
      .eq('id', profile.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ 
      message: 'Bio embedding generated successfully',
      profileId: profile.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-bio function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to analyze profile bio'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});