// client/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase project configuration
const SUPABASE_URL = 'https://vpyxyyogujddyhqgapkv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweXh5eW9ndWpkZHlocWdhcGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjY1MDAsImV4cCI6MjA2NzE0MjUwMH0.ESldrrW05CiRdRyWrablbCs2yM_MeIjDDF6MZ96zZ48';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
  },
});
