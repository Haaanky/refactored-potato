import { createClient } from '@supabase/supabase-js'

// Both values are intentionally public (static site on GitHub Pages).
// RLS policies on each table enforce room-level access control.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env.local and fill in your Supabase credentials.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
