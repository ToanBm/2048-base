import { supabase, LeaderboardEntry, LeaderboardType } from "./supabase";

/**
 * Submit a score to the leaderboard
 * Each user can only have ONE score. New score must be higher than previous to update.
 */
export async function submitScore(
  playerAddress: string,
  score: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedAddress = playerAddress.toLowerCase();

    // Get user's current best score
    const currentBest = await getUserBestScore(normalizedAddress);

    // Check if new score is higher than current best
    if (score <= currentBest) {
      return {
        success: false,
        error: `Score must be higher than your current best (${currentBest})`,
      };
    }

    // Delete all old scores for this user
    const { error: deleteError } = await supabase
      .from("leaderboard")
      .delete()
      .eq("player_address", normalizedAddress)
      .eq("game_type", "2048");

    if (deleteError) {
      console.error("Error deleting old scores:", deleteError);
      return { success: false, error: deleteError.message };
    }

    // Insert new score
    const { error: insertError } = await supabase.from("leaderboard").insert({
      player_address: normalizedAddress,
      score: score,
      game_type: "2048",
    });

    if (insertError) {
      console.error("Error inserting new score:", insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error submitting score:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get top N scores from All-Time leaderboard
 */
export async function getTopAllTime(
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching all-time leaderboard:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching all-time leaderboard:", error);
    return [];
  }
}

/**
 * Get top N scores from Weekly leaderboard
 */
export async function getTopWeekly(
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .gte("timestamp", oneWeekAgo.toISOString())
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching weekly leaderboard:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching weekly leaderboard:", error);
    return [];
  }
}

/**
 * Get top N scores from Daily leaderboard
 */
export async function getTopDaily(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .gte("timestamp", oneDayAgo.toISOString())
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching daily leaderboard:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching daily leaderboard:", error);
    return [];
  }
}

/**
 * Get user's best score
 */
export async function getUserBestScore(
  playerAddress: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("score")
      .eq("player_address", playerAddress.toLowerCase())
      .order("score", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return 0;
    }

    return data.score || 0;
  } catch (error) {
    console.error("Error fetching user best score:", error);
    return 0;
  }
}

/**
 * Get user's rank in All-Time leaderboard
 */
export async function getUserRank(
  playerAddress: string
): Promise<number | null> {
  try {
    // Get user's best score
    const userBest = await getUserBestScore(playerAddress);
    if (userBest === 0) return null;

    // Count how many players have higher scores
    const { count, error } = await supabase
      .from("leaderboard")
      .select("*", { count: "exact", head: true })
      .gt("score", userBest);

    if (error) {
      console.error("Error fetching user rank:", error);
      return null;
    }

    // Rank is count + 1 (if 0 players have higher score, rank is 1)
    return (count || 0) + 1;
  } catch (error) {
    console.error("Error fetching user rank:", error);
    return null;
  }
}

