// client/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// These must be set in Lovable → Environment Variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>("https://vpyxyyogujddyhqgapkv.supabase.co, eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweXh5eW9ndWpkZHlocWdhcGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjY1MDAsImV4cCI6MjA2NzE0MjUwMH0.ESldrrW05CiRdRyWrablbCs2yM_MeIjDDF6MZ96zZ48, {
  auth: {
    storage: localStorage,       // persist session in the browser
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',            // good default for SPAs
  },
});
