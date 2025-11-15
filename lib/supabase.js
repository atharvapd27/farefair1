import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// These will be populated when user provides credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabase = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

export { supabase }

// Database schema for reference (to be created in Supabase)
/*
-- Users table (handled by Supabase Auth)

-- Search History table
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  start_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  ola_price INTEGER NOT NULL,
  uber_price INTEGER NOT NULL,
  rapido_price INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Favourites table
CREATE TABLE favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  route_name TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_search_history_user ON search_history(user_id);
CREATE INDEX idx_favourites_user ON favourites(user_id);
*/
