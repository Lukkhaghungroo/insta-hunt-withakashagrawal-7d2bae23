// client/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// These must be set in Lovable → Environment Variables
const SUPABASE_URL = import.meta.env.https://vpyxyyogujddyhqgapkv.supabase.co!;
const SUPABASE_ANON_KEY = import.meta.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweXh5eW9ndWpkZHlocWdhcGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjY1MDAsImV4cCI6MjA2NzE0MjUwMH0.ESldrrW05CiRdRyWrablbCs2yM_MeIjDDF6MZ96zZ48!;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,       // persist session in the browser
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',            // good default for SPAs
  },
});
