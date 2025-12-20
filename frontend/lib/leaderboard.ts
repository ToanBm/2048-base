"use client";

import { game2048Contract } from "./game2048";
import { createPublicClient, http, Address, isAddress } from "viem";
import { base } from "viem/chains";

// Public client for reading contract (no wallet needed)
// Use Base public RPC with timeout
const getPublicClient = () => {
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://base-rpc.publicnode.com";
  return createPublicClient({
    chain: base,
    transport: http(rpcUrl, {
      timeout: 10000, // 10 second timeout
      retryCount: 2,
      retryDelay: 1000,
    }),
  });
};

const publicClient = getPublicClient();

// Check if contract exists on chain
async function checkContractExists(address: string): Promise<boolean> {
  try {
    const code = await publicClient.getBytecode({ address: address as Address });
    return code !== undefined && code !== "0x";
  } catch {
    return false;
  }
}

// Type for leaderboard entry (compatible with existing UI)
export interface LeaderboardEntry {
  id: string;
  player_address: string;
  score: number;
  timestamp: string;
}

export type LeaderboardType = "all-time" | "weekly" | "daily";

/**
 * Validate score before submission
 * Returns validation result
 */
export async function validateScore(
  playerAddress: string,
  score: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check if contract exists on chain
    const contractExists = await checkContractExists(game2048Contract.address);
    if (!contractExists) {
      return {
        valid: false,
        error: "Contract not deployed. Please deploy the contract first.",
      };
    }

    // Check current best score first
    const currentBest = await getUserBestScore(playerAddress);
    
    if (score <= currentBest) {
      return {
        valid: false,
        error: `Score must be higher than your current best (${currentBest})`,
      };
    }

    return { valid: true };
  } catch (error: any) {
    console.error("Error validating score:", error);
    return {
      valid: false,
      error: error?.message || "Failed to validate score",
    };
  }
}

/**
 * Submit a score to the contract
 * Requires wallet connection and user signature
 * Returns transaction hash, caller should wait for confirmation
 */
export async function submitScore(
  playerAddress: string,
  score: number,
  writeContract: any // wagmi writeContract function
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    // Check if contract exists on chain
    const contractExists = await checkContractExists(game2048Contract.address);
    if (!contractExists) {
      return {
        success: false,
        error: "Contract not deployed. Please deploy the contract first.",
      };
    }

    // Check current best score first
    const currentBest = await getUserBestScore(playerAddress);
    
    if (score <= currentBest) {
      return {
        success: false,
        error: `Score must be higher than your current best (${currentBest})`,
      };
    }

    console.log("Submitting score to contract:", { address: game2048Contract.address, score });
    
    // Submit to contract via writeContract
    // Note: writeContract is not async, it triggers wallet popup and sets hash via hook
    try {
      writeContract({
        ...game2048Contract,
        functionName: "submitScore",
        args: [BigInt(score)],
      });
      // If no error thrown, transaction was initiated
      // Hash will be available from useWriteContract hook (data: hash)
      return { success: true };
    } catch (error: any) {
      // If writeContract throws immediately (e.g., simulation fails)
      throw error;
    }
  } catch (error: any) {
    console.error("Error submitting score:", error);
    return {
      success: false,
      error: error?.message || "Failed to submit score",
    };
  }
}

/**
 * Get top N scores from contract (All-Time)
 */
export async function getTopAllTime(
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  try {
    // Check if contract exists on chain
    const contractExists = await checkContractExists(game2048Contract.address);
    if (!contractExists) {
      console.warn("Contract not deployed at address:", game2048Contract.address);
      return [];
    }

    const topScores = await publicClient.readContract({
      ...game2048Contract,
      functionName: "getTopScores",
      args: [BigInt(limit)],
    });

    // Handle empty array or invalid response
    if (!Array.isArray(topScores)) {
      return [];
    }

    return topScores.map((score: any, index: number) => ({
      id: `contract-${index}`,
      player_address: score.player || "",
      score: Number(score.score || 0),
      timestamp: new Date(Number(score.timestamp || 0) * 1000).toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching all-time leaderboard:", error);
    // Return empty array on error instead of throwing
    return [];
  }
}

/**
 * Get top N scores from Weekly leaderboard
 * Note: Contract doesn't support time-based filtering, so we filter client-side
 */
export async function getTopWeekly(
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  try {
    const allScores = await getTopAllTime(100);
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return allScores
      .filter((entry) => new Date(entry.timestamp).getTime() >= oneWeekAgo)
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching weekly leaderboard:", error);
    return [];
  }
}

/**
 * Get top N scores from Daily leaderboard
 * Note: Contract doesn't support time-based filtering, so we filter client-side
 */
export async function getTopDaily(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const allScores = await getTopAllTime(100);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    return allScores
      .filter((entry) => new Date(entry.timestamp).getTime() >= oneDayAgo)
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching daily leaderboard:", error);
    return [];
  }
}

/**
 * Get user's best score from contract
 */
export async function getUserBestScore(
  playerAddress: string
): Promise<number> {
  try {
    // Validate address format
    if (!playerAddress || !playerAddress.startsWith("0x")) {
      console.warn("Invalid player address:", playerAddress);
      return 0;
    }

    // Check if contract exists on chain
    const contractExists = await checkContractExists(game2048Contract.address);
    if (!contractExists) {
      console.warn("Contract not deployed at address:", game2048Contract.address);
      return 0;
    }

    console.log("Fetching best score for:", playerAddress, "from contract:", game2048Contract.address);
    
    const score = await publicClient.readContract({
      ...game2048Contract,
      functionName: "getUserBestScore",
      args: [playerAddress as Address],
    });

    const scoreNumber = Number(score);
    console.log("Best score retrieved:", scoreNumber);
    return scoreNumber;
  } catch (error: any) {
    console.error("Error fetching user best score:", error);
    console.error("Contract address:", game2048Contract.address);
    console.error("Error details:", error?.message || error);
    // Return 0 on error instead of throwing
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
    const rank = await publicClient.readContract({
      ...game2048Contract,
      functionName: "getUserRank",
      args: [playerAddress as Address],
    });

    const rankNumber = Number(rank);
    return rankNumber > 0 ? rankNumber : null;
  } catch (error) {
    console.error("Error fetching user rank:", error);
    return null;
  }
}
