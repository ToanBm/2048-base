-- Supabase Database Schema for 2048 Game Leaderboard
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_address TEXT NOT NULL,
  score BIGINT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  game_type TEXT DEFAULT '2048',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_score_desc ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_player ON leaderboard(player_address);
CREATE INDEX IF NOT EXISTS idx_leaderboard_timestamp ON leaderboard(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_game_type ON leaderboard(game_type);

-- Create a view for top 100 all-time
CREATE OR REPLACE VIEW top_100_all_time AS
SELECT 
  id,
  player_address,
  score,
  timestamp,
  game_type,
  ROW_NUMBER() OVER (ORDER BY score DESC) as rank
FROM leaderboard
WHERE game_type = '2048'
ORDER BY score DESC
LIMIT 100;

-- Create a view for top 10 weekly
CREATE OR REPLACE VIEW top_10_weekly AS
SELECT 
  id,
  player_address,
  score,
  timestamp,
  game_type,
  ROW_NUMBER() OVER (ORDER BY score DESC) as rank
FROM leaderboard
WHERE game_type = '2048'
  AND timestamp >= NOW() - INTERVAL '7 days'
ORDER BY score DESC
LIMIT 10;

-- Create a view for top 10 daily
CREATE OR REPLACE VIEW top_10_daily AS
SELECT 
  id,
  player_address,
  score,
  timestamp,
  game_type,
  ROW_NUMBER() OVER (ORDER BY score DESC) as rank
FROM leaderboard
WHERE game_type = '2048'
  AND timestamp >= NOW() - INTERVAL '1 day'
ORDER BY score DESC
LIMIT 10;

-- Enable Row Level Security (RLS)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Anyone can read leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "Anyone can insert scores" ON leaderboard;
DROP POLICY IF EXISTS "Users can delete own scores" ON leaderboard;

-- Create policy: Anyone can read leaderboard
CREATE POLICY "Anyone can read leaderboard"
  ON leaderboard
  FOR SELECT
  USING (true);

-- Create policy: Anyone can insert scores
CREATE POLICY "Anyone can insert scores"
  ON leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Create policy: Users can delete their own scores (for updating to new score)
CREATE POLICY "Users can delete own scores"
  ON leaderboard
  FOR DELETE
  USING (true); -- Allow anyone to delete (we check score > previous in app logic)

-- Optional: Create policy to allow users to update their own scores (if needed)
-- CREATE POLICY "Users can update own scores"
--   ON leaderboard
--   FOR UPDATE
--   USING (player_address = current_setting('request.jwt.claims', true)::json->>'address');

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON leaderboard TO anon;
GRANT SELECT, INSERT, DELETE ON leaderboard TO authenticated;

