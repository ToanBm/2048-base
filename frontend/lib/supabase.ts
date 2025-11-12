import { createClient } from "@supabase/supabase-js";

// Supabase configuration
// Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase URL or Anon Key missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file"
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for leaderboard
export interface LeaderboardEntry {
  id: string;
  player_address: string;
  score: number;
  timestamp: string;
  game_type: string;
}

// Leaderboard types
export type LeaderboardType = "all-time" | "weekly" | "daily";

